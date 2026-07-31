from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GrievanceBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    category: str = "Others"
    ward_id: int | None = None
    lat: float = 0.0
    lng: float = 0.0
    source: str = "csv"


class GrievanceCreate(GrievanceBase):
    pass


class GrievanceUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    score: float | None = None


class GrievanceOut(GrievanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ward_name: str
    subcategory: str | None = None
    status: str
    priority: str
    score: float
    sentiment: str
    created_at: datetime
    updated_at: datetime | None = None


class GrievanceList(BaseModel):
    items: list[GrievanceOut]
    total: int
    page: int
    limit: int
