from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Grievance
from app.schemas.analytics import AnalyticsSummary, CategoryCount, KpiCards, TrendPoint, WardCount

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def summary(ward_id: int | None = None, db: Session = Depends(get_db)):
    scope = [Grievance.ward_id == ward_id] if ward_id is not None else []
    total = db.scalar(select(func.count(Grievance.id)).where(*scope)) or 0
    open_count = db.scalar(
        select(func.count(Grievance.id)).where(
            Grievance.status.notin_(["resolved", "closed"]), *scope
        )
    ) or 0
    critical = db.scalar(
        select(func.count(Grievance.id)).where(Grievance.priority == "critical", *scope)
    ) or 0
    avg_score = db.scalar(select(func.avg(Grievance.score)).where(*scope)) or 0.0
    categories = [
        CategoryCount(category=category, count=count)
        for category, count in db.execute(
            select(Grievance.category, func.count(Grievance.id))
            .where(*scope)
            .group_by(Grievance.category)
            .order_by(func.count(Grievance.id).desc())
        ).all()
    ]
    wards = [
        WardCount(ward_id=ward_id, ward_name=ward_name, count=count)
        for ward_id, ward_name, count in db.execute(
            select(Grievance.ward_id, Grievance.ward_name, func.count(Grievance.id))
            .where(*scope)
            .group_by(Grievance.ward_id, Grievance.ward_name)
            .order_by(func.count(Grievance.id).desc())
        ).all()
    ]
    return AnalyticsSummary(
        kpis=KpiCards(total=total, open=open_count, critical=critical, avg_score=round(avg_score, 2)),
        categories=categories,
        wards=wards,
        trends=trend_points(db, 30, ward_id),
    )


def trend_points(db: Session, days: int, ward_id: int | None = None) -> list[TrendPoint]:
    since = datetime.utcnow() - timedelta(days=days)
    scope = [Grievance.ward_id == ward_id] if ward_id is not None else []
    rows = db.execute(
        select(func.date(Grievance.created_at).label("day"), func.count(Grievance.id))
        .where(Grievance.created_at >= since, *scope)
        .group_by(func.date(Grievance.created_at))
        .order_by(func.date(Grievance.created_at))
    ).all()
    return [TrendPoint(date=row[0], count=row[1]) for row in rows]


@router.get("/trends", response_model=list[TrendPoint])
def trends(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    return trend_points(db, days)


@router.get("/categories", response_model=list[CategoryCount])
def categories(db: Session = Depends(get_db)):
    return [
        CategoryCount(category=category, count=count)
        for category, count in db.execute(
            select(Grievance.category, func.count(Grievance.id))
            .group_by(Grievance.category)
            .order_by(func.count(Grievance.id).desc())
        ).all()
    ]


@router.get("/wards", response_model=list[WardCount])
def wards(db: Session = Depends(get_db)):
    return [
        WardCount(ward_id=ward_id, ward_name=ward_name, count=count)
        for ward_id, ward_name, count in db.execute(
            select(Grievance.ward_id, Grievance.ward_name, func.count(Grievance.id))
            .group_by(Grievance.ward_id, Grievance.ward_name)
            .order_by(func.count(Grievance.id).desc())
        ).all()
    ]
