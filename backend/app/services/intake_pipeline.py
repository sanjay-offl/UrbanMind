"""Shared persistence path for browser and messaging-channel complaints."""

from __future__ import annotations

import asyncio
import base64
from typing import Any

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Grievance
from app.services import gemini
from app.services.classifier import category_for, classify
from app.services.embeddings import embed_text
from app.services.geocoding import geocode_mentions
from app.services.photos import describe_civic_photo, store_photo
from app.services.redaction import redact_text
from app.services.scorer import score as compute_score
from app.services.speech import SpeechNotConfigured, synthesize_speech


class IntakeUnavailable(RuntimeError):
    """Live intake requires configured Google AI services."""


async def submit_complaint(
    db: Session,
    text: str,
    *,
    source: str = "web",
    photo: bytes | None = None,
    photo_mime_type: str | None = None,
) -> dict[str, Any]:
    if gemini.is_demo_mode():
        raise IntakeUnavailable("Live intake is disabled in demo mode; configure Google AI credentials.")
    if not text.strip() and photo is None:
        raise ValueError("Complaint text or a photo is required.")

    photo_url = None
    if photo is not None:
        if photo_mime_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError("Photo must be JPEG, PNG, or WebP.")
        photo_url = await asyncio.to_thread(store_photo, photo, photo_mime_type)
        photo_result = await describe_civic_photo(photo, photo_mime_type)
        photo_description = str(photo_result.get("description") or "").strip()
        if photo_description:
            text = f"{text.strip()}\n\nPhoto description: {photo_description}".strip()

    result = await classify(text)
    if result.get("demo_mode"):
        raise IntakeUnavailable("Gemini is unavailable; complaint was not stored as a live classification.")

    original_text = text
    redacted_text, pii_redacted, _redaction_method = await redact_text(
        original_text, bool(result.get("pii_detected"))
    )
    location = await asyncio.to_thread(geocode_mentions, result.get("location_mentions") or [])
    located = location is not None
    grievance = Grievance(
        title=redacted_text[:255],
        description=redacted_text,
        category=category_for(result),
        subcategory=result.get("subcategory") or None,
        ward_id=None,
        ward_name=(location or {}).get("district") or "Unlocated",
        lat=(location or {}).get("lat"),
        lng=(location or {}).get("lng"),
        state=(location or {}).get("state"),
        district=(location or {}).get("district"),
        block=(location or {}).get("block"),
        photo_url=photo_url,
        status="classified" if located else "unlocated",
        sentiment=result.get("sentiment") or "neutral",
        source=source[:20],
        sector=result.get("sector"),
        detected_language=result.get("detected_language"),
        language_confidence=result.get("language_confidence"),
        english_summary=result.get("english_summary"),
        urgency=result.get("urgency"),
        classifier_confidence=result.get("confidence"),
        classification_model=result.get("model"),
        pii_detected=bool(result.get("pii_detected")),
        pii_redacted=pii_redacted,
    )
    grievance.score, grievance.priority = compute_score(grievance)
    db.add(grievance)
    db.flush()
    vector = await asyncio.to_thread(
        embed_text, f"{grievance.sector}: {grievance.title} {grievance.description}"
    )
    if vector:
        grievance.embedding = vector
    db.commit()
    db.refresh(grievance)

    location_name = grievance.district or ((result.get("location_mentions") or [None])[0]) or "your area"
    spoken_confirmation = (
        f"Your {grievance.sector or 'civic issue'} complaint in {location_name} has been received "
        f"with reference ID {grievance.id}. We will update you within 72 hours."
    )
    audio_base64 = None
    tts_model = None
    if settings.vertex_ai_project:
        language = str(grievance.detected_language or "en")
        language_code = language if "-" in language else f"{language}-IN"
        try:
            audio = await asyncio.to_thread(synthesize_speech, spoken_confirmation, language_code)
            audio_base64 = base64.b64encode(audio).decode("ascii")
            tts_model = "google-cloud-texttospeech"
        except SpeechNotConfigured:
            pass
        except Exception:  # noqa: BLE001 - persistence is independent of TTS availability
            pass

    return {
        "id": grievance.id,
        "reference_id": str(grievance.id),
        "status": grievance.status,
        "sector": grievance.sector,
        "detected_language": grievance.detected_language,
        "classification": result,
        "photo_url": grievance.photo_url,
        "confirmation_text": spoken_confirmation,
        "confirmation_audio_base64": audio_base64,
        "confirmation_audio_mime_type": "audio/mpeg" if audio_base64 else None,
        "confirmation_model": tts_model,
        "model": result.get("model", settings.gemini_model),
        "demo_mode": False,
    }