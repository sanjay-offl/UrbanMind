"""Tests for Phase 4: Priority Index, Demand Forecasting, Recommendation Engine, and Evaluation."""

import pytest
from app.services.scorer import compute_priority_scores_sql, explain_score
from app.services.forecasting import predict_demand, get_district_trends
from app.services.recommendations import (
    compute_beneficiaries,
    draft_recommendation_with_gemini,
    approve_recommendation,
    list_recommendations,
)
from app.services.evaluator import get_cached_or_default_eval
from app.models import Recommendation


def test_priority_index_formula_and_explainability():
    sample_row = {
        "district_name": "Dindigul",
        "demand_intensity": 91.0,
        "infrastructure_deficit": 78.0,
        "vulnerability_weight": 82.0,
        "investment_gap": 74.0,
        "priority_index": 82.8,
    }
    explanation = explain_score(sample_row)
    assert "Dindigul scores 82.8" in explanation
    assert "demand intensity is 91.0" in explanation
    assert "infrastructure deficit is 78.0" in explanation
    assert "vulnerability weight is 82.0" in explanation
    assert "investment gap is 74.0" in explanation

    # Test SQL priority score computation
    scores = compute_priority_scores_sql()
    assert isinstance(scores, list)
    assert len(scores) > 0
    top = scores[0]
    assert "priority_index" in top
    assert 0.0 <= float(top["priority_index"]) <= 100.0
    assert "demand_intensity" in top
    assert "infrastructure_deficit" in top
    assert "vulnerability_weight" in top
    assert "investment_gap" in top


def test_demand_forecasting_and_trends():
    forecast = predict_demand(district="Dindigul", sector="water", month=11)
    assert "predicted_volume" in forecast
    assert forecast["predicted_volume"] > 0
    assert "historical_lags" in forecast
    assert len(forecast["historical_lags"]) == 6

    trends = get_district_trends("Dindigul", "water")
    assert len(trends) == 7  # 6 past months + 1 forecast month
    assert trends[-1]["month"] == "Nov 2026 (Forecast)"
    assert trends[-1]["actual"] is None
    assert trends[-1]["predicted"] > 0


@pytest.mark.asyncio
async def test_recommendation_lifecycle_and_approval(db_session):
    # 1. Beneficiaries must be computed mathematically, never hallucinated
    pop = 2159775
    deficit_pct = 71.6
    beneficiaries = compute_beneficiaries(pop, deficit_pct)
    assert beneficiaries == int(pop * (deficit_pct / 100.0))

    # 2. Draft recommendation with Gemini / verified baseline
    draft = await draft_recommendation_with_gemini(
        district_name="Dindigul",
        state_code="TN",
        sector="water",
        priority_score=82.8,
        score_breakdown={
            "district_name": "Dindigul",
            "priority_index": 82.8,
            "demand_intensity": 91.0,
            "infrastructure_deficit": 71.6,
            "vulnerability_weight": 82.0,
            "investment_gap": 74.0,
        },
        top_clusters=[{"cluster_id": "C-1", "size": 47, "example_text": "Water pipeline burst in Dindigul"}],
        indicator_value=0.284,
        population=pop,
        vulnerability_metrics={"rural_pct": 72.0, "sc_st_pct": 28.0},
    )
    assert draft["review_status"] == "pending_human_review"
    assert "Jal Jeevan Mission" in draft["scheme_alignment"]
    assert draft["estimated_beneficiaries"] == beneficiaries

    # 3. Store in DB
    rec = Recommendation(
        district_name="Dindigul",
        state_code="TN",
        sector="water",
        priority_score=82.8,
        problem_statement=draft["problem_statement"],
        evidence_summary=draft["evidence_summary"],
        estimated_beneficiaries=draft["estimated_beneficiaries"],
        scheme_alignment=draft["scheme_alignment"],
        recommended_action=draft["recommended_action"],
        risks=draft["risks"],
        confidence=draft["confidence"],
        review_status="pending_human_review",
    )
    db_session.add(rec)
    db_session.commit()

    # 4. Policymaker cannot see pending recommendations
    policymaker_view = list_recommendations(db_session, for_role="policymaker")
    assert rec.id not in [r.id for r in policymaker_view]

    # 5. Officer approves recommendation
    approved = approve_recommendation(db_session, rec.id, officer_name="District Officer Raman")
    assert approved.review_status == "approved"
    assert approved.reviewed_by == "District Officer Raman"

    # 6. Now visible in policymaker view
    policymaker_view = list_recommendations(db_session, for_role="policymaker")
    assert rec.id in [r.id for r in policymaker_view]


def test_eval_metrics_endpoint_data():
    eval_data = get_cached_or_default_eval()
    assert eval_data["total_evaluated"] == 300
    assert eval_data["overall_accuracy"] >= 90.0
    assert "per_language" in eval_data
    assert "weakest_languages" in eval_data
    assert "human_review_safeguard" in eval_data
