from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Grievance
from app.schemas.grievance import GrievanceList, GrievanceOut, GrievanceUpdate

router = APIRouter(prefix="/grievances", tags=["grievances"])

SORTABLE_FIELDS = {"score", "created_at", "id", "priority", "ward_id"}


def _parse_sort(sort_by: str):
    parts = sort_by.strip().lower().split()
    field = parts[0] if parts else "score"
    direction = "desc" if len(parts) > 1 and parts[1] == "desc" else "asc"
    if field not in SORTABLE_FIELDS:
        field, direction = "score", "desc"
    order_column = getattr(Grievance, field)
    return desc(order_column) if direction == "desc" else asc(order_column)


@router.get("/", response_model=GrievanceList)
def list_grievances(
    category: str | None = None,
    ward_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    sort_by: str = "score desc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Grievance)
    if category:
        stmt = stmt.where(Grievance.category == category)
    if ward_id is not None:
        stmt = stmt.where(Grievance.ward_id == ward_id)
    if status:
        stmt = stmt.where(Grievance.status == status)
    if priority:
        stmt = stmt.where(Grievance.priority == priority)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(or_(Grievance.title.ilike(pattern), Grievance.description.ilike(pattern)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(_parse_sort(sort_by)).offset((page - 1) * limit).limit(limit)
    ).all()
    return GrievanceList(items=items, total=total, page=page, limit=limit)


@router.get("/{grievance_id}", response_model=GrievanceOut)
def get_grievance(grievance_id: int, db: Session = Depends(get_db)):
    grievance = db.get(Grievance, grievance_id)
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    return grievance


@router.patch("/{grievance_id}", response_model=GrievanceOut)
def update_grievance(grievance_id: int, payload: GrievanceUpdate, db: Session = Depends(get_db)):
    grievance = db.get(Grievance, grievance_id)
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(grievance, field, value)
    grievance.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(grievance)
    return grievance


@router.delete("/{grievance_id}")
def delete_grievance(grievance_id: int, db: Session = Depends(get_db)):
    grievance = db.get(Grievance, grievance_id)
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    db.delete(grievance)
    db.commit()
    return {"deleted": grievance_id}
