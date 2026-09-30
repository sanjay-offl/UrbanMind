"""Demo data loader.

Reads pre-computed example classifications from ``data/demo_classifications.json``.
These rows are *pre-computed* — they are never presented as a live Gemini result
and every consumer must report ``demo_mode=True`` alongside them.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[3]
_CANDIDATES = [
    _REPO_ROOT / "data" / "demo_classifications.json",
    _REPO_ROOT / "backend" / "data" / "demo_classifications.json",
]


@lru_cache(maxsize=1)
def load_demo_dataset() -> dict[str, Any]:
    for path in _CANDIDATES:
        if path.exists():
            try:
                dataset = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(dataset, list):
                    return {"source": "precomputed_demo", "entries": dataset}
                if isinstance(dataset, dict):
                    return dataset
            except (OSError, json.JSONDecodeError):
                continue
    return {"source": "unavailable", "entries": [], "ranked_issues": []}


def demo_entries() -> list[dict[str, Any]]:
    dataset = load_demo_dataset()
    entries = dataset.get("entries") or []
    return [entry for entry in entries if isinstance(entry, dict)]


def demo_classification(text: str) -> dict[str, Any] | None:
    """Return the pre-computed classification matching ``text``, if any."""
    needle = (text or "").strip().lower()
    if not needle:
        return None
    entries = demo_entries()
    for entry in entries:
        sample = entry.get("sample_text") or entry.get("query") or ""
        if str(sample).strip().lower() == needle:
            classification = entry.get("classification")
            return dict(classification if isinstance(classification, dict) else entry)
    for entry in entries:
        terms = entry.get("match_terms") or []
        if any(str(term).lower() in needle for term in terms):
            classification = entry.get("classification")
            return dict(classification if isinstance(classification, dict) else entry)
    return None


def demo_ranked_issues(complaints: list[str]) -> list[dict[str, Any]]:
    """Select pre-computed ranked demo issues (labelled as demo, never as Gemini)."""
    dataset = load_demo_dataset()
    ranked = dataset.get("ranked_issues") or []
    if ranked:
        return [dict(item) for item in ranked[:5]]
    # The demo view previews only the pre-computed classifications in the file.
    picked = [entry for entry in demo_entries() if entry.get("sector")]
    picked.sort(key=lambda item: int(item.get("urgency") or 0), reverse=True)
    return [
        {
            "rank": index + 1,
            "summary": entry.get("english_summary") or "",
            "reason": "Pre-computed demo classification (not a live model call).",
            "category": entry.get("sector") or "other",
            "ward": (entry.get("location_mentions") or [None])[0],
            "score": int(entry.get("urgency") or 0) * 20,
            "sector": entry.get("sector") or "other",
        }
        for index, entry in enumerate(picked[:5])
    ]


def demo_description() -> dict[str, Any]:
    dataset = load_demo_dataset()
    return {
        "mode": "demo",
        "source": dataset.get("source", "precomputed_demo"),
        "updated_at": dataset.get("updated_at"),
        "entries": len(demo_entries()),
        "note": dataset.get("note"),
    }
