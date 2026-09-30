import pytest


@pytest.mark.parametrize(
    ("transcript", "language", "confidence"),
    [
        ("No water for five days", "ta-IN", 0.91),
        ("सड़क पर गड्ढा है", "hi-IN", 0.88),
    ],
)
def test_voice_endpoint_returns_transcript_metadata(
    client, monkeypatch, transcript, language, confidence
):
    from app.routers import intake

    monkeypatch.setattr(
        intake,
        "transcribe_audio",
        lambda audio: {
            "transcript": transcript,
            "detected_language": language,
            "confidence": confidence,
        },
    )
    response = client.post(
        "/api/v1/intake/voice",
        files={"file": ("recording.webm", b"audio-bytes", "audio/webm")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "transcript": transcript,
        "detected_language": language,
        "confidence": confidence,
        "model": "chirp",
        "demo_mode": False,
    }


def test_voice_endpoint_rejects_empty_audio(client):
    response = client.post(
        "/api/v1/intake/voice",
        files={"file": ("empty.webm", b"", "audio/webm")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Audio recording is empty"


def test_voice_endpoint_rejects_audio_over_limit(client):
    from app.routers.intake import MAX_AUDIO_BYTES

    response = client.post(
        "/api/v1/intake/voice",
        files={"file": ("large.webm", b"x" * (MAX_AUDIO_BYTES + 1), "audio/webm")},
    )

    assert response.status_code == 413