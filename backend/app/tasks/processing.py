import asyncio

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models import Grievance
from app.services.classifier import classify
from app.services.embeddings import embed_text, upsert_grievance
from app.services.scorer import score as compute_score

process_queue: asyncio.Queue[int] = asyncio.Queue()

OPEN_STATUSES = ["pending", "classified", "in_progress"]


def enqueue_pending() -> int:
    db = SessionLocal()
    try:
        ids = db.scalars(select(Grievance.id).where(Grievance.status == "pending")).all()
    finally:
        db.close()
    for grievance_id in ids:
        process_queue.put_nowait(int(grievance_id))
    return len(ids)


async def process_pending(db: Session | None = None) -> int:
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        queued = []
        while not process_queue.empty():
            queued.append(process_queue.get_nowait())
        if queued:
            pending = list(
                db.scalars(
                    select(Grievance)
                    .where(Grievance.id.in_(queued), Grievance.status == "pending")
                ).all()
            )
        else:
            pending = list(db.scalars(select(Grievance).where(Grievance.status == "pending")).all())
        if not pending:
            return 0
        texts = [f"{grievance.title}. {grievance.description}" for grievance in pending]
        results = await asyncio.gather(*(classify(text) for text in texts))
        open_counts = dict(
            db.execute(
                select(Grievance.ward_id, func.count(Grievance.id))
                .where(Grievance.status.in_(OPEN_STATUSES))
                .group_by(Grievance.ward_id)
            ).all()
        )
        for grievance, result in zip(pending, results):
            grievance.category = result["category"]
            grievance.subcategory = result["subcategory"]
            grievance.sentiment = result["sentiment"]
            grievance.score, grievance.priority = compute_score(grievance, open_counts)
            grievance.status = "classified"
            vector = embed_text(f"{grievance.category}: {grievance.title} {grievance.description}")
            if vector is not None:
                upsert_grievance(
                    vector,
                    {
                        "grievance_id": grievance.id,
                        "title": grievance.title,
                        "category": grievance.category,
                        "ward_name": grievance.ward_name,
                        "status": grievance.status,
                    },
                )
        db.commit()
        return len(pending)
    finally:
        if own_session:
            db.close()
