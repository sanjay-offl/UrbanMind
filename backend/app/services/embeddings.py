from typing import Any

import openai
from pinecone import Pinecone

from app.config import settings

_pinecone_client: Pinecone | None = None


def embed_text(text: str) -> list[float] | None:
    if not settings.openai_api_key:
        return None
    try:
        client = openai.OpenAI(api_key=settings.openai_api_key)
        response = client.embeddings.create(model="text-embedding-3-small", input=text[:8000])
        return response.data[0].embedding
    except Exception:
        return None


def _pinecone() -> Pinecone | None:
    global _pinecone_client
    if not settings.pinecone_api_key:
        return None
    if _pinecone_client is None:
        _pinecone_client = Pinecone(api_key=settings.pinecone_api_key)
    return _pinecone_client


def upsert_grievance(vector: list[float], metadata: dict[str, Any]) -> Any:
    try:
        client = _pinecone()
        if client is None:
            return None
        index = client.Index(settings.pinecone_index)
        return index.upsert(
            vectors=[
                {
                    "id": str(metadata.get("grievance_id")),
                    "values": vector,
                    "metadata": metadata,
                }
            ]
        )
    except Exception:
        return None


def query_similar(vector: list[float], top_k: int = 5) -> list[Any]:
    try:
        client = _pinecone()
        if client is None:
            return []
        index = client.Index(settings.pinecone_index)
        response = index.query(vector=vector, top_k=top_k, include_metadata=True)
        return response.get("matches", [])
    except Exception:
        return []
