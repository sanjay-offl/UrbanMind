"""Civic photo description and Cloud Storage helpers."""

from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any

from app.config import settings
from app.services import gemini

PHOTO_PROMPT = (
    "This is a citizen photo of a civic issue in India. Describe the problem visible "
    "in this image in one sentence, estimate its severity from 1 to 5, and identify "
    "the most likely civic sector from: water, roads, sanitation, electricity, "
    "public_safety, other. Return JSON only."
)
PHOTO_SCHEMA = {
    "type": "object",
    "properties": {
        "description": {"type": "string"},
        "severity": {"type": "integer", "minimum": 1, "maximum": 5},
        "sector": {
            "type": "string",
            "enum": ["water", "roads", "sanitation", "electricity", "public_safety", "other"],
        },
    },
    "required": ["description", "severity", "sector"],
}


async def describe_civic_photo(image: bytes, mime_type: str) -> dict[str, Any]:
    return await gemini.generate_multimodal_json(
        PHOTO_PROMPT,
        image,
        mime_type,
        schema=PHOTO_SCHEMA,
    )


def store_photo(image: bytes, mime_type: str) -> str:
    """Upload a photo to a configured GCS bucket and return a signed URL, or data URI fallback."""
    if not settings.google_cloud_storage_bucket:
        import base64

        return f"data:{mime_type};base64,{base64.b64encode(image).decode('ascii')}"
    from google.cloud import storage

    client = storage.Client(project=settings.vertex_ai_project or None)
    blob = client.bucket(settings.google_cloud_storage_bucket).blob(f"intake/{uuid.uuid4().hex}")
    blob.upload_from_string(image, content_type=mime_type)
    return blob.generate_signed_url(expiration=timedelta(days=7), method="GET")