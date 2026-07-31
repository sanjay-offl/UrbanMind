import json
from typing import Any

import httpx

from app.config import settings
from app.utils.prompt_templates import CATEGORIES, build_classifier_messages

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
VALID_SENTIMENTS = {"positive", "negative", "neutral"}


def _defaults() -> dict[str, Any]:
    return {"category": "Others", "subcategory": None, "sentiment": "neutral"}


def _parse_json(raw: str) -> dict[str, Any]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if 0 <= start < end:
            return json.loads(cleaned[start : end + 1])
        raise


async def classify(text: str) -> dict[str, Any]:
    if not settings.anthropic_api_key:
        return _defaults()
    messages = build_classifier_messages(text)
    payload = {
        "model": settings.claude_model,
        "max_tokens": 512,
        "system": messages[0]["content"],
        "messages": messages[1:],
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ANTHROPIC_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        raw = data["content"][0]["text"]
        parsed = _parse_json(raw)
        category = parsed.get("category") if parsed.get("category") in CATEGORIES else "Others"
        sentiment = (
            parsed.get("sentiment")
            if parsed.get("sentiment") in VALID_SENTIMENTS
            else "neutral"
        )
        return {"category": category, "subcategory": parsed.get("subcategory"), "sentiment": sentiment}
    except (httpx.HTTPError, KeyError, IndexError, ValueError, json.JSONDecodeError):
        return _defaults()
