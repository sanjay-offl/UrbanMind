from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.report_generator import REPORTS_DIR, generate_report

router = APIRouter(prefix="/reports", tags=["reports"])

REPORT_TYPES = {"summary", "ward", "category"}


@router.post("/generate")
def generate(payload: dict, db: Session = Depends(get_db)):
    report_type = payload.get("type")
    ward_id = payload.get("ward_id")
    if report_type not in REPORT_TYPES:
        raise HTTPException(status_code=400, detail="type must be one of: summary, ward, category")
    if report_type == "ward" and ward_id is None:
        raise HTTPException(status_code=400, detail="ward_id is required for ward reports")
    return generate_report(report_type, db, ward_id)


@router.get("/")
def list_reports():
    if not REPORTS_DIR.exists():
        return []
    reports = []
    for path in sorted(REPORTS_DIR.glob("*.pdf"), reverse=True):
        reports.append(
            {
                "id": path.stem,
                "type": path.stem.split("-")[0],
                "created_at": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                "file_url": f"/api/v1/reports/{path.stem}/download",
            }
        )
    return reports


@router.get("/{report_id}/download")
def download_report(report_id: str):
    path = REPORTS_DIR / f"{report_id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path, media_type="application/pdf", filename=path.name)
