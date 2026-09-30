"""Embeddings + vector storage.

Embeddings come from Gemini ``text-embedding-004`` (Vertex AI when a project is
configured, the Google AI SDK when only an API key is present).  Vectors are
stored in PostgreSQL as ``ARRAY(FLOAT)`` — BigQuery migration lands in Phase 3.

Vectors are stored directly in PostgreSQL. When embeddings are unavailable the
functions return ``None`` and callers simply skip vector work.
"""

from __future__ import annotations

from typing import Any

from app.config import settings
from app.services import gemini

EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSIONS = 768
MAX_EMBED_CHARS = 8000

_model: Any = None
_model_key: str | None = None


def embeddings_configured() -> bool:
    """True when a real embedding call can be made."""
    return gemini.is_demo_mode() is False


def _model_instance() -> Any:
    """Vertex AI / Google AI embedding model, created lazily and cached."""
    global _model, _model_key
    signature = (settings.google_api_key, settings.vertex_ai_project, EMBEDDING_MODEL)
    if _model is not None and _model_key == signature:
        return _model
    if settings.google_api_key:
        with _suppress_deprecation():
            import google.generativeai as genai

            _model = genai
        _model_key = signature
        return _model
    if settings.vertex_ai_project:
        from vertexai.language_models import TextEmbeddingModel

        _model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL)
        _model_key = signature
        return _model
    return None


class _suppress_deprecation:
    def __enter__(self) -> None:
        import warnings

        self._ctx = warnings.catch_warnings()
        self._ctx.__enter__()
        warnings.simplefilter("ignore", FutureWarning)

    def __exit__(self, *exc: Any) -> bool:
        return self._ctx.__exit__(*exc)


def embed_text(text: str) -> list[float] | None:
    """Return a Gemini embedding, or None when unavailable/not configured."""
    if not text or not embeddings_configured():
        return None
    payload = text[:MAX_EMBED_CHARS]
    try:
        client = _model_instance()
        if client is None:
            return None
        if settings.google_api_key:
            response = client.embed_content(
                model=f"models/{EMBEDDING_MODEL}", content=payload, task_type="retrieval_document"
            )
            values = (
                response.get("embedding")
                if isinstance(response, dict)
                else getattr(response, "embedding", None)
            )
            if values and isinstance(values[0], (list, tuple)):
                values = values[0]
        else:
            embeddings = client.get_embeddings([payload])
            values = embeddings[0].values
        vector = [float(value) for value in values]
        return vector or None
    except Exception:  # noqa: BLE001 - embeddings are best effort
        return None


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity in plain Python (no external vector DB involved)."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def is_duplicate(a: list[float], b: list[float], threshold: float | None = None) -> bool:
    limit = threshold if threshold is not None else settings.dedup_similarity_threshold
    return cosine_similarity(a, b) >= limit
