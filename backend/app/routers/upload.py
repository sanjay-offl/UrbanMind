import asyncio
import io
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Grievance, Ward
from app.services.classifier import classify_and_rank
from app.services.ingestion import clean_complaint_text, parse_csv
from app.tasks.processing import process_pending

router = APIRouter(prefix="/upload", tags=["upload"])

TEMPLATE = (
    "title,description,ward_name,latitude,longitude,source,created_at\n"
    "Water supply disruption in Begumpet,No water in our area since morning,Begumpet,17.4493,78.4740,csv,2026-07-20T09:00:00Z"
)

TEXT_COLUMN_VARIANTS = [
    "complaint_text",
    "complaint",
    "text",
    "description",
    "message",
    "content",
    "grievance",
    "issue",
    "body",
    "details",
]


@router.get("/template")
def download_template():
    return PlainTextResponse(TEMPLATE, media_type="text/csv")


@router.post("/analyze")
async def analyze_complaints(
    file: UploadFile = File(None),
    text: str = Form(None),
    db: Session = Depends(get_db),
):
    """
    Core demo endpoint.
    Accepts CSV file OR raw text.
    Returns top 5 ranked issues from Claude.
    """
    complaints = []

    if file:
        # Read CSV, extract complaint_text column
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        # Try common column names
        text_col = next(
            (c for c in df.columns if "complaint" in c.lower() or "text" in c.lower() or "description" in c.lower()),
            df.columns[0],
        )
        complaints = [clean_complaint_text(v) for v in df[text_col].dropna().tolist()]
        complaints = [c for c in complaints if c]

    elif text:
        # Split pasted text by newlines
        complaints = [clean_complaint_text(line.strip()) for line in text.split("\n") if line.strip()]
        complaints = [c for c in complaints if c]

    if not complaints:
        raise HTTPException(status_code=400, detail="No complaints found in input")

    if len(complaints) > 500:
        complaints = complaints[:500]  # limit for demo

    # Call classifier service
    ranked = await classify_and_rank(complaints)

    return {
        "total_analyzed": len(complaints),
        "ranked_issues": ranked,
        "model": "claude-sonnet-4-6",
        "timestamp": datetime.utcnow().isoformat(),
    }


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
