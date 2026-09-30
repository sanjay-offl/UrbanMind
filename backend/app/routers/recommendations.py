"""Recommendations router for administrative project proposals."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Recommendation
from app.services.recommendations import approve_recommendation, list_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/")
def get_recommendations(
    role: str = Query("policymaker", description="User role: citizen, officer, policymaker"),
    db: Session = Depends(get_db),
):
    """Policymakers see approved recommendations; officers see all drafts."""
    recs = list_recommendations(db, for_role=role)
    return [
        {
            "id": r.id,
            "district_name": r.district_name,
            "state_code": r.state_code,
            "sector": r.sector,
            "priority_score": r.priority_score,
            "problem_statement": r.problem_statement,
            "evidence_summary": r.evidence_summary,
            "estimated_beneficiaries": r.estimated_beneficiaries,
            "scheme_alignment": r.scheme_alignment,
            "recommended_action": r.recommended_action,
            "risks": r.risks,
            "confidence": r.confidence,
            "review_status": r.review_status,
            "reviewed_by": r.reviewed_by,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recs
    ]


@router.patch("/{recommendation_id}/approve")
def approve_project(
    recommendation_id: int,
    officer_name: str = Query("District Officer"),
    db: Session = Depends(get_db),
):
    """Officer approves a draft recommendation for policymaker presentation."""
    rec = approve_recommendation(db, recommendation_id, officer_name=officer_name)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "id": rec.id,
        "review_status": rec.review_status,
        "reviewed_by": rec.reviewed_by,
        "reviewed_at": rec.reviewed_at.isoformat() if rec.reviewed_at else None,
    }
