from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AdminUnit(Base):
    """Full administrative hierarchy for India: country -> state -> district -> block -> village."""

    __tablename__ = "admin_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_units.id", ondelete="CASCADE"), nullable=True, index=True
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    lgd_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state_code: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    population_2011: Mapped[int | None] = mapped_column(Integer, nullable=True)
    geojson: Mapped[str | None] = mapped_column(Text, nullable=True)

    parent: Mapped[AdminUnit | None] = relationship("AdminUnit", remote_side=[id], backref="children")

    def __init__(self, **kwargs):
        if "code" in kwargs and "lgd_code" not in kwargs:
            kwargs["lgd_code"] = kwargs.pop("code")
        if "population" in kwargs and "population_2011" not in kwargs:
            kwargs["population_2011"] = kwargs.pop("population")
        if "level" not in kwargs:
            kwargs["level"] = "district"
        super().__init__(**kwargs)

    # Backward compatibility properties for legacy Ward references
    @property
    def code(self) -> str:
        return self.lgd_code or self.state_code or ""

    @property
    def population(self) -> int | None:
        return self.population_2011

