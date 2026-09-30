import pytest


def test_whatsapp_webhook_accepts_verification_style_payload(client):
    response = client.post("/webhooks/whatsapp", json={"object": "whatsapp_business_account", "entry": []})

    assert response.status_code == 200
    assert response.json() == {
        "accepted": True,
        "status": "WhatsApp integration: ready for Meta approval",
        "processed": 0,
    }


def test_telegram_webhook_requires_bot_token(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "telegram_bot_token", "")
    response = client.post("/webhooks/telegram", json={"update_id": 1})

    assert response.status_code == 503
    assert "TELEGRAM_BOT_TOKEN" in response.json()["detail"]


def test_geocoder_returns_unlocated_without_maps_key(monkeypatch):
    from app.config import settings
    from app.services.geocoding import geocode_mentions

    monkeypatch.setattr(settings, "google_maps_api_key", "")

    assert geocode_mentions(["Dindigul"]) is None