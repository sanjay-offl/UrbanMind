"""Display translations via Google Cloud Translation API v2.

Original Unicode text is preserved verbatim in the database; this service is
only used when a reader wants the text shown in another language.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from app.config import settings

DEFAULT_TARGET = "en"


@lru_cache(maxsize=1)
def _client() -> Any:
    from google.cloud import translate_v2 as translate

    return translate.Client()


def _fallback_detect(text: str) -> dict[str, Any]:
    """Deterministic script-based hint used only when the API is unavailable."""
    return {"detected_language": "und", "confidence": 0.0, "method": "unavailable"}


def detect_language(text: str) -> dict[str, Any]:
    """Detect the BCP-47 language of ``text`` (Cloud Translation v2)."""
    if not text:
        return {"detected_language": "und", "confidence": 0.0, "method": "empty"}
    if not _available():
        return _fallback_detect(text)
    try:
        result = _client().detect_language(text)
        return {
            "detected_language": result.get("language") or "und",
            "confidence": float(result.get("confidence") or 0.0),
            "method": "google_translate_v2",
        }
    except Exception:  # noqa: BLE001 - never block intake on translation
        return _fallback_detect(text)


def translate_text(text: str, target_language: str = DEFAULT_TARGET) -> dict[str, Any]:
    """Translate ``text`` for display. Returns the text unchanged on failure."""
    if not text:
        return {"translated_text": "", "detected_source_language": None, "method": "empty"}
    if not _available():
        return {
            "translated_text": text,
            "detected_source_language": None,
            "method": "passthrough",
        }
    try:
        result = _client().translate(text, target_language=target_language)
        if isinstance(result, list):
            result = result[0]
        return {
            "translated_text": result.get("translatedText") or text,
            "detected_source_language": result.get("detectedSourceLanguage"),
            "method": "google_translate_v2",
        }
    except Exception:  # noqa: BLE001
        return {
            "translated_text": text,
            "detected_source_language": None,
            "method": "passthrough",
        }


def _credentials() -> bool:
    import os

    return bool(settings.google_application_credentials or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))


def _available() -> bool:
    if settings.google_api_key or settings.vertex_ai_project:
        return True
    return _credentials()
