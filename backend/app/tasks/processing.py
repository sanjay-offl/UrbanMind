"""Background processing: classify -> redact -> score -> embed -> cluster."""

import asyncio

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models import Grievance
from app.services.classifier import category_for, classify
from app.services.embeddings import embed_text
from app.services.geocoding import geocode_mentions
from app.services.redaction import redact_text
from app.services.scorer import score as compute_score
from app.tasks.dedup import assign_clusters

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
            await _apply_classification(db, grievance, result, open_counts)
        db.commit()

        # Background deduplication over stored Gemini embeddings.
        assign_clusters(db=db)
        return len(pending)
    finally:
        if own_session:
            db.close()


async def _apply_classification(
    db: Session,
    grievance: Grievance,
    result: dict,
    open_counts: dict | None = None,
) -> Grievance:
    """Write one classification (plus PII redaction and embedding) to a row."""
    grievance.category = category_for(result)
    grievance.subcategory = result.get("subcategory") or grievance.subcategory
    grievance.sentiment = result.get("sentiment") or grievance.sentiment
    grievance.sector = result.get("sector")
    grievance.detected_language = result.get("detected_language")
    grievance.language_confidence = result.get("language_confidence")
    grievance.english_summary = result.get("english_summary")
    grievance.urgency = result.get("urgency")
    grievance.classifier_confidence = result.get("confidence")
    grievance.classification_model = result.get("model")

    # PII redaction happens before the text is stored.
    pii_detected = bool(result.get("pii_detected"))
    grievance.pii_detected = pii_detected
    if pii_detected:
        redacted, was_redacted, _method = await redact_text(grievance.description, True)
        if was_redacted:
            grievance.description = redacted
            grievance.title = redacted[:255]
            grievance.pii_redacted = True

    grievance.score, grievance.priority = compute_score(grievance, open_counts)
    location = await asyncio.to_thread(
        geocode_mentions, result.get("location_mentions") or []
    )
    if location:
        grievance.lat = location["lat"]
        grievance.lng = location["lng"]
        grievance.state = location.get("state")
        grievance.district = location.get("district")
        grievance.block = location.get("block")
        grievance.ward_name = location.get("district") or location.get("formatted_address") or grievance.ward_name
        grievance.status = "classified"
    else:
        grievance.lat = None
        grievance.lng = None
        grievance.state = None
        grievance.district = None
        grievance.block = None
        grievance.status = "unlocated"

    vector = embed_text(f"{grievance.sector or grievance.category}: {grievance.title} {grievance.description}")
    if vector:
        grievance.embedding = vector
    db.flush()
    return grievance
