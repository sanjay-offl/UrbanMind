"""Gemini Flash classifier for citizen requests.

One structured-output Gemini Flash call per request.  The schema below is the
exact response schema passed to the Gemini generation config.

Demo mode (no GOOGLE_API_KEY / VERTEX_AI_PROJECT) serves only pre-computed
classifications from ``data/demo_classifications.json`` and reports
``model="none"`` + ``demo_mode=True``.  No keyword heuristic is ever reported as
a Gemini result.
"""

from __future__ import annotations

import asyncio
from typing import Any

from app.services import demo_data, gemini

SECTORS: tuple[str, ...] = (
    "water",
    "roads",
    "sanitation",
    "electricity",
    "health",
    "education",
    "housing",
    "agriculture",
    "digital_connectivity",
    "public_safety",
    "transport",
    "environment",
    "other",
)

SENTIMENTS: tuple[str, ...] = ("positive", "negative", "neutral")

VULNERABLE_GROUPS: tuple[str, ...] = ("elderly", "women", "children", "disabled")

MAX_INPUT_CHARS = 5000

# Legacy category names used by the grievances table / officer queue.
SECTOR_TO_CATEGORY: dict[str, str] = {
    "water": "Water Supply",
    "roads": "Roads & Infrastructure",
    "sanitation": "Sanitation & Waste",
    "electricity": "Electricity",
    "health": "Health & Medical",
    "education": "Education",
    "housing": "Housing & Buildings",
    "agriculture": "Water Supply",
    "digital_connectivity": "Public Transport",
    "public_safety": "Public Safety",
    "transport": "Public Transport",
    "environment": "Noise & Environment",
    "other": "Others",
}

CLASSIFICATION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "detected_language": {"type": "string", "description": "BCP-47 code, e.g. ta, hi, bn"},
        "language_confidence": {"type": "number"},
        "original_text": {"type": "string", "description": "The input text, unchanged"},
        "english_summary": {"type": "string", "description": "Maximum 50 words"},
        "sector": {"type": "string", "enum": list(SECTORS)},
        "subcategory": {"type": "string"},
        "urgency": {"type": "integer", "minimum": 1, "maximum": 5},
        "sentiment": {"type": "string", "enum": list(SENTIMENTS)},
        "location_mentions": {"type": "array", "items": {"type": "string"}},
        "vulnerable_group_flags": {"type": "array", "items": {"type": "string"}},
        "pii_detected": {"type": "boolean"},
        "confidence": {"type": "number"},
    },
    "required": [
        "detected_language",
        "language_confidence",
        "original_text",
        "english_summary",
        "sector",
        "subcategory",
        "urgency",
        "sentiment",
        "location_mentions",
        "vulnerable_group_flags",
        "pii_detected",
        "confidence",
    ],
}

SYSTEM_INSTRUCTION = (
    "You are the classification service for UrbanMind, a national civic demand "
    "platform for India. You receive one citizen request, possibly in any Indian "
    "language or code-mixed. Respond ONLY with JSON matching the supplied schema. "
    "english_summary must be at most 50 words. urgency is 1 (low) to 5 (life "
    "threatening). Set pii_detected=true when the text contains a phone number, "
    "Aadhaar-like number, address or full personal name. Never invent facts."
)


def describe() -> dict[str, Any]:
    return gemini.describe()


def is_demo_mode() -> bool:
    return gemini.is_demo_mode()


def _clamp(value: Any, low: float, high: float, default: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if number != number:  # NaN
        return default
    return max(low, min(high, number))


def _as_int(value: Any, default: int) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, (list, tuple)):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _truncate_for_model(text: str) -> tuple[str, bool]:
    if len(text) <= MAX_INPUT_CHARS:
        return text, False
    return text[:MAX_INPUT_CHARS], True


def normalize(payload: dict[str, Any], original_text: str) -> dict[str, Any]:
    """Coerce a model payload into the documented response schema."""
    sector = str(payload.get("sector") or "").strip().lower()
    sentiment = str(payload.get("sentiment") or "").strip().lower()
    flags = [flag for flag in _string_list(payload.get("vulnerable_group_flags")) if flag in VULNERABLE_GROUPS]
    return {
        "detected_language": str(payload.get("detected_language") or "und").strip() or "und",
        "language_confidence": round(_clamp(payload.get("language_confidence"), 0.0, 1.0, 0.0), 4),
        "original_text": original_text,
        "english_summary": " ".join(str(payload.get("english_summary") or "").split()[:50]),
        "sector": sector if sector in SECTORS else "other",
        "subcategory": str(payload.get("subcategory") or "").strip(),
        "urgency": max(1, min(5, _as_int(payload.get("urgency"), 1))),
        "sentiment": sentiment if sentiment in SENTIMENTS else "neutral",
        "location_mentions": _string_list(payload.get("location_mentions")),
        "vulnerable_group_flags": flags,
        "pii_detected": bool(payload.get("pii_detected")),
        "confidence": round(_clamp(payload.get("confidence"), 0.0, 1.0, 0.0), 4),
    }


def _urgent_urgency(payload: dict[str, Any]) -> int:
    return max(1, min(5, _as_int(payload.get("urgency"), 1)))


def _build_prompt(text: str) -> str:
    return (
        "Classify the following citizen request. Return the JSON object only.\n\n"
        f"--- REQUEST START ---\n{text}\n--- REQUEST END ---"
    )


def _meta(model: str, demo: bool, called: bool, **extra: Any) -> dict[str, Any]:
    meta = {"model": model, "demo_mode": demo, "called": called}
    meta.update(extra)
    return meta


def _empty_result(text: str) -> dict[str, Any]:
    base = normalize(
        {
            "detected_language": "und",
            "language_confidence": 0.0,
            "english_summary": "",
            "sector": "other",
            "subcategory": "empty_input",
            "urgency": 1,
            "sentiment": "neutral",
            "location_mentions": [],
            "vulnerable_group_flags": [],
            "pii_detected": False,
            "confidence": 0.0,
        },
        text,
    )
    base.update(_meta("none", gemini.is_demo_mode(), called=False, note="empty_input"))
    return base


def _demo_result(text: str, note: str | None = None) -> dict[str, Any]:
    payload = demo_data.demo_classification(text)
    if payload is None:
        payload = demo_data.demo_classification("") or {}
    base = normalize(payload, text)
    base.update(_meta("none", True, called=False, note=note or "precomputed_demo"))
    return base


async def _live_classify(text: str) -> dict[str, Any]:
    model_text, _truncated = _truncate_for_model(text)
    payload = await gemini.generate_json(
        _build_prompt(model_text),
        schema=CLASSIFICATION_SCHEMA,
        model=settings_model(),
        system=SYSTEM_INSTRUCTION,
    )
    result = normalize(payload, text)
    return result


def settings_model() -> str:
    from app.config import settings

    return settings.gemini_model


async def classify(text: str) -> dict[str, Any]:
    """Classify one citizen request. Returns the response schema + metadata."""
    original = text if isinstance(text, str) else str(text)
    truncated = len(original) > MAX_INPUT_CHARS
    if not original.strip():
        result = _empty_result(original)
    elif gemini.is_demo_mode():
        result = _demo_result(original)
    else:
        try:
            result = await _live_classify(original)
            result.update(_meta(settings_model(), False, called=True))
        except Exception as exc:  # noqa: BLE001 - unavailable -> labelled demo data
            # Service unavailable: serve only pre-computed demo data, clearly labelled.
            result = _demo_result(original, note=f"live_call_failed: {type(exc).__name__}")
    # original_text is always the exact input; only the model prompt is truncated.
    result["input_truncated_for_model"] = truncated
    return result


async def classify_batch(texts: list[str]) -> list[dict[str, Any]]:
    """Classify many requests concurrently (Gemini semaphore = 10)."""
    if not texts:
        return []
    return list(await asyncio.gather(*(classify(text) for text in texts)))


def category_for(result: dict[str, Any]) -> str:
    """Legacy officer-queue category derived from the classified sector."""
    return SECTOR_TO_CATEGORY.get(str(result.get("sector") or "other"), "Others")


async def classify_and_rank(complaints: list[str]) -> list[dict[str, Any]]:
    """Rank the most urgent complaints from a list of complaint strings.

    Rank ordering comes from Gemini classification fields only.  When the model
    is unavailable the pre-computed demo ranking is returned and labelled.
    """
    if not complaints:
        return []
    if gemini.is_demo_mode():
        ranked = demo_data.demo_ranked_issues(complaints)
        for item in ranked:
            item["model"] = "none"
            item["demo_mode"] = True
        return ranked

    results = await classify_batch(complaints)
    scored = sorted(
        zip(complaints, results),
        key=lambda pair: (-_urgent_urgency(pair[1]), -float(pair[1].get("confidence") or 0.0)),
    )
    ranked: list[dict[str, Any]] = []
    for index, (complaint, result) in enumerate(scored[:5]):
        locations = result.get("location_mentions") or []
        ranked.append(
            {
                "rank": index + 1,
                "summary": (result.get("english_summary") or complaint)[:160],
                "reason": (
                    f"Classified as {result.get('sector')} at urgency "
                    f"{result.get('urgency')} with confidence {result.get('confidence')}."
                ),
                "category": category_for(result),
                "sector": result.get("sector"),
                "ward": locations[0] if locations else None,
                "score": int(round(float(result.get("confidence") or 0) * 100)),
                "model": settings_model(),
                "demo_mode": False,
            }
        )
    return ranked


def classify_sync(text: str) -> dict[str, Any]:
    """Blocking wrapper used by scripts and background workers."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop is not None and loop.is_running():  # pragma: no cover - defensive
        raise RuntimeError("classify_sync called from a running event loop")
    return asyncio.run(classify(text))
