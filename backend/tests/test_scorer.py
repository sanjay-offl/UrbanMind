from datetime import datetime, timedelta

from app.models import Grievance
from app.services.scorer import priority_for, score


def _grievance(text: str, created_at: datetime, ward_id: int = 1) -> Grievance:
    return Grievance(
        title="Test grievance",
        description=text,
        ward_id=ward_id,
        ward_name="Begumpet",
        lat=0.0,
        lng=0.0,
        created_at=created_at,
    )


def test_high_severity_text_scores_high():
    grievance = _grievance("There is a road accident near the main junction", datetime.utcnow())
    score_value, priority = score(grievance, counts={})
    assert score_value >= 60
    assert priority == "high"


def test_recency_decay_scores_old_grievance_lower():
    text = "water outage in our street since yesterday"
    fresh = _grievance(text, datetime.utcnow())
    old = _grievance(text, datetime.utcnow() - timedelta(days=25))
    fresh_score, _ = score(fresh, counts={})
    old_score, _ = score(old, counts={})
    assert old_score < fresh_score


def test_ward_volume_multiplier_bumps_score():
    text = "water outage in our street since yesterday"
    lonely = _grievance(text, datetime.utcnow(), ward_id=1)
    crowded = _grievance(text, datetime.utcnow(), ward_id=2)
    lonely_score, _ = score(lonely, counts={1: 0})
    crowded_score, _ = score(crowded, counts={2: 10})
    assert crowded_score > lonely_score


def test_priority_bucket_mapping():
    cases = [
        ("road accident medical emergency near the junction", "critical"),
        ("pothole and garbage pileup on the street", "high"),
        ("water outage in our building", "medium"),
        ("thank you for your service", "low"),
    ]
    for text, expected in cases:
        grievance = _grievance(text, datetime.utcnow())
        _, priority = score(grievance, counts={})
        assert priority == expected, f"expected {expected} for {text!r}"


def test_priority_for_thresholds():
    assert priority_for(85) == "critical"
    assert priority_for(80) == "critical"
    assert priority_for(70) == "high"
    assert priority_for(60) == "high"
    assert priority_for(45) == "medium"
    assert priority_for(40) == "medium"
    assert priority_for(20) == "low"
