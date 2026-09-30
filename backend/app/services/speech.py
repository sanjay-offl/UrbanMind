"""Google Cloud Speech and Text-to-Speech adapters."""

from __future__ import annotations

from app.config import settings


class SpeechNotConfigured(RuntimeError):
    """Raised when speech APIs cannot be used in the current environment."""


def transcribe_audio(audio: bytes) -> dict[str, str | float]:
    """Transcribe audio with Chirp and the configured Indian language set."""
    if not settings.vertex_ai_project:
        raise SpeechNotConfigured("Set VERTEX_AI_PROJECT to enable voice transcription.")

    from google.cloud import speech_v2

    client = speech_v2.SpeechClient()
    response = client.recognize(
        request={
            "recognizer": (
                f"projects/{settings.vertex_ai_project}/locations/global/recognizers/_"
            ),
            "config": {
                "auto_decoding_config": {},
                "language_codes": settings.speech_language_codes,
                "model": settings.speech_model,
                "features": {"enable_automatic_punctuation": True},
            },
            "content": audio,
        }
    )
    for result in response.results:
        if not result.alternatives:
            continue
        alternative = result.alternatives[0]
        if alternative.transcript.strip():
            return {
                "transcript": alternative.transcript.strip(),
                "detected_language": getattr(result, "language_code", None) or "und",
                "confidence": float(alternative.confidence or 0.0),
            }
    return {"transcript": "", "detected_language": "und", "confidence": 0.0}


def synthesize_speech(text: str, language_code: str) -> bytes:
    """Return an MP3 voice confirmation using Google Cloud Text-to-Speech."""
    if not settings.vertex_ai_project:
        raise SpeechNotConfigured("Set VERTEX_AI_PROJECT to enable voice confirmations.")

    from google.cloud import texttospeech

    client = texttospeech.TextToSpeechClient()
    response = client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=texttospeech.VoiceSelectionParams(language_code=language_code),
        audio_config=texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3),
    )
    return response.audio_content