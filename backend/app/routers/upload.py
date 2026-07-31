import asyncio

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Grievance, Ward
from app.services.ingestion import parse_csv
from app.tasks.processing import process_pending

router = APIRouter(prefix="/upload", tags=["upload"])

TEMPLATE = (
    "title,description,ward_name,latitude,longitude,source,created_at\n"
    "Water supply disruption in Begumpet,No water in our area since morning,Begumpet,17.4493,78.4740,csv,2026-07-20T09:00:00Z"
)


@router.get("/template")
def download_template():
    return PlainTextResponse(TEMPLATE, media_type="text/csv")


@router.post("/")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
    content = await file.read()
    rows, errors = parse_csv(content)
    inserted = 0
    for row in rows:
        ward = db.scalar(select(Ward).where(func.lower(Ward.name) == row["ward_name"].lower()))
        if ward is None:
            errors.append(f"Ward not found for row: {row['ward_name']}")
            continue
        grievance = Grievance(
            title=row["title"],
            description=row["description"],
            category="Others",
            ward_id=ward.id,
            ward_name=ward.name,
            lat=row.get("latitude") or 0.0,
            lng=row.get("longitude") or 0.0,
            status="pending",
            source=row.get("source") or "csv",
        )
        if row.get("created_at") is not None:
            grievance.created_at = row["created_at"]
        db.add(grievance)
        inserted += 1
    if inserted:
        db.commit()
        asyncio.create_task(process_pending())
    return {"inserted": inserted, "errors": errors}
