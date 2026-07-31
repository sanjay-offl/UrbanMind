from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import func, select

from app.database.session import SessionLocal
from app.models import Grievance
from app.services.scorer import score as compute_score

scheduler = AsyncIOScheduler()

OPEN_STATUSES = ["pending", "classified", "in_progress"]


async def refresh_scores() -> None:
    db = SessionLocal()
    try:
        open_grievances = list(
            db.scalars(select(Grievance).where(Grievance.status.in_(OPEN_STATUSES))).all()
        )
        if not open_grievances:
            return
        counts = dict(
            db.execute(
                select(Grievance.ward_id, func.count(Grievance.id)).group_by(Grievance.ward_id)
            ).all()
        )
        for grievance in open_grievances:
            grievance.score, grievance.priority = compute_score(grievance, counts)
        db.commit()
    finally:
        db.close()


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.add_job(
            refresh_scores, "interval", hours=6, id="refresh_scores", replace_existing=True
        )
        scheduler.start()


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
