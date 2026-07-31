from datetime import datetime

from app.models import Grievance

BASE_SCORE = 20.0
MAX_SCORE = 100.0
RECENCY_DAYS = 30

SEVERITY_KEYWORDS = {
    "water outage": 25,
    "sewage leak": 30,
    "pothole": 20,
    "electrical hazard": 35,
    "garbage pileup": 15,
    "road accident": 45,
    "medical": 40,
    "crime": 50,
}


def recency_factor(created_at: datetime | None) -> float:
    if created_at is None:
        return 1.0
    age_days = (datetime.utcnow() - created_at).total_seconds() / 86400
    if age_days < 1:
        return 1.0
    if age_days >= RECENCY_DAYS:
        return 0.0
    return max(0.0, 1.0 - (age_days - 1.0) / (RECENCY_DAYS - 1.0))


def _ward_volume_multiplier(counts: dict | None, ward_id: int | None) -> float:
    if not counts or ward_id is None:
        return 1.0
    open_in_ward = int(counts.get(ward_id, 0))
    return 1.0 + min(open_in_ward, 20) * 0.01


def priority_for(score_value: float) -> str:
    if score_value >= 80:
        return "critical"
    if score_value >= 60:
        return "high"
    if score_value >= 40:
        return "medium"
    return "low"


def score(grievance: Grievance, counts: dict | None = None) -> tuple[float, str]:
    text = f"{grievance.title or ''} {grievance.description or ''}".lower()
    severity = sum(weight for keyword, weight in SEVERITY_KEYWORDS.items() if keyword in text)
    recency = recency_factor(grievance.created_at)
    volume = _ward_volume_multiplier(counts, grievance.ward_id)
    raw = (BASE_SCORE + severity * recency) * volume
    total = round(min(raw, MAX_SCORE), 2)
    return total, priority_for(total)
