from datetime import date

from pydantic import BaseModel


class KpiCards(BaseModel):
    total: int
    open: int
    critical: int
    avg_score: float


class CategoryCount(BaseModel):
    category: str
    count: int


class WardCount(BaseModel):
    ward_id: int
    ward_name: str
    count: int


class TrendPoint(BaseModel):
    date: date
    count: int


class AnalyticsSummary(BaseModel):
    kpis: KpiCards
    categories: list[CategoryCount]
    wards: list[WardCount]
    trends: list[TrendPoint]
