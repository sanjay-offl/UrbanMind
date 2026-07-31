import json

import httpx
import pytest

from app.services import classifier
from app.utils.prompt_templates import CATEGORIES


class FakeResponse:
    def __init__(self, text):
        self._text = text

    def raise_for_status(self):
        return None

    def json(self):
        return {"content": [{"text": self._text}]}


@pytest.fixture(autouse=True)
def api_key(monkeypatch):
    monkeypatch.setattr(classifier.settings, "anthropic_api_key", "test-key")


@pytest.mark.asyncio
async def test_classify_returns_category(monkeypatch):
    payload = json.dumps(
        {"category": "Water Supply", "subcategory": "Water Outage", "sentiment": "negative"}
    )

    async def fake_post(self, *args, **kwargs):
        return FakeResponse(payload)

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    result = await classifier.classify("No water supply in our area since morning")
    assert result["category"] in CATEGORIES
    assert result["category"] == "Water Supply"
    assert result["subcategory"] == "Water Outage"
    assert result["sentiment"] == "negative"


@pytest.mark.asyncio
async def test_classify_unknown_category_falls_back(monkeypatch):
    payload = json.dumps({"category": "Flying Saucers", "subcategory": None, "sentiment": "neutral"})

    async def fake_post(self, *args, **kwargs):
        return FakeResponse(payload)

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    result = await classifier.classify("Something unusual happened")
    assert result["category"] == "Others"


@pytest.mark.asyncio
async def test_classify_error_returns_defaults(monkeypatch):
    async def failing_post(self, *args, **kwargs):
        raise httpx.HTTPError("upstream failure")

    monkeypatch.setattr(httpx.AsyncClient, "post", failing_post)
    result = await classifier.classify("Water problem on my street")
    assert result == {"category": "Others", "subcategory": None, "sentiment": "neutral"}


@pytest.mark.asyncio
async def test_classify_without_api_key_returns_defaults(monkeypatch):
    monkeypatch.setattr(classifier.settings, "anthropic_api_key", "")

    async def fake_post(self, *args, **kwargs):
        raise AssertionError("httpx should not be called without an API key")

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    result = await classifier.classify("Water problem on my street")
    assert result == {"category": "Others", "subcategory": None, "sentiment": "neutral"}
