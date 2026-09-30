from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GrievanceBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    category: str = "Others"
    ward_id: int | None = None
    lat: float | None = None
    lng: float | None = None
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
    state: str | None = None
    district: str | None = None
    block: str | None = None
    photo_url: str | None = None


class GrievanceList(BaseModel):
    items: list[GrievanceOut]
    total: int
    page: int
    limit: int
