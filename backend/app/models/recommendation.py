from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Recommendation(Base):
    """Project recommendations drafted by Gemini Pro for high-priority district-sector pairs.
    
    Human-in-the-loop: review_status starts at 'pending_human_review'.
    Only 'approved' recommendations are presented in the policymaker view.
    """

    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    district_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state_code: Mapped[str] = mapped_column(String(10), nullable=False)
    sector: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    priority_score: Mapped[float] = mapped_column(Float, nullable=False)
    
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_summary: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_beneficiaries: Mapped[int] = mapped_column(Integer, nullable=False)
    scheme_alignment: Mapped[str] = mapped_column(String(200), nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    risks: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.9)
    
    # Human-in-the-loop review status
    review_status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending_human_review", index=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
