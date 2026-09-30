from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

# PostgreSQL stores embeddings as ARRAY(FLOAT); SQLite (unit tests) uses JSON.
EMBEDDING_TYPE = ARRAY(Float()).with_variant(JSON(), "sqlite")


class Grievance(Base):
    __tablename__ = "grievances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("wards.id"), nullable=True, index=True)
    ward_name: Mapped[str] = mapped_column(String(100), nullable=False)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    block: Mapped[str | None] = mapped_column(String(100), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="low", index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sentiment: Mapped[str] = mapped_column(String(20), nullable=False, default="neutral")
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="csv")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=func.now())

    # --- Gemini classification (Phase 1) -----------------------------------
    sector: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    detected_language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    language_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    english_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency: Mapped[int | None] = mapped_column(Integer, nullable=True)
    classifier_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    classification_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    pii_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pii_redacted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # --- Deduplication (Phase 1) -------------------------------------------
    cluster_id: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    embedding: Mapped[list[float] | None] = mapped_column(EMBEDDING_TYPE, nullable=True)
