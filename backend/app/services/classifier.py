import json
from typing import Any

import httpx

from app.config import settings
from app.utils.prompt_templates import CATEGORIES, build_classifier_messages

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
VALID_SENTIMENTS = {"positive", "negative", "neutral"}

RANKING_PROMPT = """
You are an AI civic intelligence system for Indian city governments.

You will receive a list of citizen complaints.
Your job is to identify the TOP 5 most urgent issues.

For each of the top 5, return a JSON object with these fields:
  rank: integer 1-5 (1 = most urgent)
  summary: one clear sentence describing the core issue (max 15 words)
  reason: one sentence explaining why this ranks here (max 20 words)
  category: one of [Infrastructure, Roads, Water, Sanitation, 
                    Electricity, Public Safety, Other]
  ward: ward name or number if mentioned, else null
  score: integer 0-100 representing urgency
  affected_count: estimated number of citizens affected

Scoring criteria (use all of these):
  - How many people are affected
  - How urgent the safety risk is
  - Whether the issue is mentioned multiple times
  - How long it may have been ongoing
  - Impact on essential services (water, roads, sanitation)

Return ONLY a valid JSON array of exactly 5 objects.
No explanation. No markdown. No extra text.
Start your response with [ and end with ]

Complaints:
{complaints}
"""

STRICTER_PROMPT = RANKING_PROMPT + """
IMPORTANT: Respond with a plain JSON array only. Do not wrap it in code
blocks, do not add any commentary, do not use markdown.
"""

VALID_RANKING_CATEGORIES = {
    "Infrastructure",
    "Roads",
    "Water",
    "Sanitation",
    "Electricity",
    "Public Safety",
    "Other",
}

# Offline fallback scoring used when no Claude API key is configured.
_FALLBACK_KEYWORDS = [
    ("sewage", 95, "Sanitation"),
    ("water", 90, "Water"),
    ("supply", 85, "Water"),
    ("pothole", 80, "Roads"),
    ("road", 70, "Roads"),
    ("drain", 82, "Sanitation"),
    ("garbage", 75, "Sanitation"),
    ("waste", 72, "Sanitation"),
    ("power", 78, "Electricity"),
    ("electric", 76, "Electricity"),
    ("transformer", 80, "Electricity"),
    ("streetlight", 62, "Infrastructure"),
    ("dog", 65, "Public Safety"),
    ("encroach", 60, "Public Safety"),
    ("manhole", 74, "Public Safety"),
]


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


def _parse_ranked_json(raw: str) -> list[dict[str, Any]]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("["), cleaned.rfind("]")
        if 0 <= start < end:
            parsed = json.loads(cleaned[start : end + 1])
        else:
            raise
    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array of ranked issues")
    return [item for item in parsed if isinstance(item, dict)]


def _fallback_ranking(complaints: list[str]) -> list[dict[str, Any]]:
    """Keyword-based heuristic ranking used when no API key is configured."""
    scored: list[tuple[float, str, str, str]] = []
    for complaint in complaints:
        lower = complaint.lower()
        score = 50
        category = "Other"
        for keyword, weight, cat in _FALLBACK_KEYWORDS:
            if keyword in lower:
                score = max(score, weight)
                category = cat
        scored.append((score, complaint, category, lower.count(" ") + 1))

    scored.sort(key=lambda item: (-item[0], item[3]))
    ranked = []
    for index, (score, text, category, words) in enumerate(scored[:5]):
        ranked.append(
            {
                "rank": index + 1,
                "summary": text[:120],
                "reason": f"Matched priority signals for {category.lower()} with estimated urgency.",
                "category": category,
                "ward": None,
                "score": int(score),
                "affected_count": max(50, words * 25),
            }
        )
    return ranked


async def _call_anthropic(prompt: str) -> str:
    payload = {
        "model": settings.claude_model,
        "max_tokens": 1024,
        "system": "You return only valid JSON.",
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(ANTHROPIC_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    return data["content"][0]["text"]


def _normalize_ranked(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for index, item in enumerate(items):
        category = item.get("category")
        if category not in VALID_RANKING_CATEGORIES:
            category = "Other"
        normalized.append(
            {
                "rank": index + 1,
                "summary": str(item.get("summary") or ""),
                "reason": str(item.get("reason") or ""),
                "category": category,
                "ward": item.get("ward") or None,
                "score": int(item.get("score") or 0),
                "affected_count": int(item.get("affected_count") or 0),
            }
        )
    return normalized[:5]


async def classify_and_rank(complaints: list[str]) -> list[dict[str, Any]]:
    """Rank the top 5 most urgent issues from a list of complaint strings."""
    if not complaints:
        return []
    if not settings.anthropic_api_key:
        return _fallback_ranking(complaints)

    numbered = "\n".join(
        f"{index}. {text}" for index, text in enumerate(complaints, start=1)
    )
    prompts = [
        RANKING_PROMPT.format(complaints=numbered),
        STRICTER_PROMPT.format(complaints=numbered),
    ]

    last_error: Exception | None = None
    for prompt in prompts:
        try:
            raw = await _call_anthropic(prompt)
            items = _parse_ranked_json(raw)
            if items:
                return _normalize_ranked(items)
        except (httpx.HTTPError, KeyError, IndexError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc

    if last_error is not None:
        return _fallback_ranking(complaints)
    return _fallback_ranking(complaints)


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
