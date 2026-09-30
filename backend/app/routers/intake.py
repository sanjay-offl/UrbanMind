"""Multichannel citizen intake endpoints."""

import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.services.intake_pipeline import IntakeUnavailable, submit_complaint
from app.services.speech import SpeechNotConfigured, transcribe_audio

router = APIRouter(prefix="/intake", tags=["intake"])
MAX_AUDIO_BYTES = 10 * 1024 * 1024
MAX_PHOTO_BYTES = 10 * 1024 * 1024


@router.post("/complaints")
async def create_complaint(
    text: str = Form(""),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    photo_bytes = None
    mime_type = None
    if photo is not None:
        mime_type = photo.content_type
        photo_bytes = await photo.read(MAX_PHOTO_BYTES + 1)
        if len(photo_bytes) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=413, detail="Photo exceeds 10 MB")
    try:
        return await submit_complaint(
            db,
            text,
            source="web",
            photo=photo_bytes,
            photo_mime_type=mime_type,
        )
    except IntakeUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - keep provider details out of public errors
        raise HTTPException(status_code=502, detail="Complaint intake failed") from exc


@router.post("/voice")
async def transcribe_voice(file: UploadFile = File(...)):
    """Transcribe browser-recorded webm/opus audio with Cloud Speech Chirp."""
    audio = await file.read(MAX_AUDIO_BYTES + 1)
    if not audio:
        raise HTTPException(status_code=400, detail="Audio recording is empty")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio recording exceeds 10 MB")
    try:
        result = await asyncio.to_thread(transcribe_audio, audio)
    except SpeechNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - return a clear upstream service error
        raise HTTPException(status_code=502, detail="Speech transcription failed") from exc

    return {
        **result,
        "model": settings.speech_model,
        "demo_mode": False,
    }