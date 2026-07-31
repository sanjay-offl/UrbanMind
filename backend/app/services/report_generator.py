from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Grievance, Ward

REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"


def _count(db: Session, ward_id: int | None, *criteria) -> int:
    stmt = select(func.count(Grievance.id))
    if ward_id is not None:
        stmt = stmt.where(Grievance.ward_id == ward_id)
    for criterion in criteria:
        stmt = stmt.where(criterion)
    return db.scalar(stmt) or 0


def _summary_table(db: Session, ward_id: int | None) -> list[list[str]]:
    rows = [["Metric", "Value"]]
    rows.append(["Total grievances", str(_count(db, ward_id))])
    rows.append(["Pending", str(_count(db, ward_id, Grievance.status == "pending"))])
    rows.append(["Classified", str(_count(db, ward_id, Grievance.status == "classified"))])
    rows.append(["In progress", str(_count(db, ward_id, Grievance.status == "in_progress"))])
    rows.append(["Resolved", str(_count(db, ward_id, Grievance.status == "resolved"))])
    rows.append(["Closed", str(_count(db, ward_id, Grievance.status == "closed"))])
    rows.append(["Critical", str(_count(db, ward_id, Grievance.priority == "critical"))])
    rows.append(["High", str(_count(db, ward_id, Grievance.priority == "high"))])
    rows.append(["Medium", str(_count(db, ward_id, Grievance.priority == "medium"))])
    rows.append(["Low", str(_count(db, ward_id, Grievance.priority == "low"))])
    return rows


def _grouped_table(db: Session, ward_id: int | None, field, label: str) -> list[list[str]]:
    stmt = select(field, func.count(Grievance.id))
    if ward_id is not None:
        stmt = stmt.where(Grievance.ward_id == ward_id)
    rows = db.execute(stmt.group_by(field).order_by(func.count(Grievance.id).desc())).all()
    return [[label, "Count"]] + [[str(value), str(count)] for value, count in rows]


def _styled_table(rows: list[list[str]]) -> Table:
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f6feb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f4f7")]),
            ]
        )
    )
    return table


def _build_story(db: Session, report_type: str, ward_id: int | None) -> list:
    styles = getSampleStyleSheet()
    now = datetime.now()
    title = f"UrbanMind {report_type.title()} Report"
    if report_type == "ward" and ward_id is not None:
        ward = db.get(Ward, ward_id)
        if ward is not None:
            title = f"UrbanMind Ward Report - {ward.name}"
    story = [
        Paragraph(title, styles["Title"]),
        Paragraph(f"Generated: {now.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]),
        Spacer(1, 14),
    ]
    story.append(Paragraph("Summary", styles["Heading2"]))
    story.append(_styled_table(_summary_table(db, ward_id)))
    story.append(Spacer(1, 12))
    story.append(Paragraph("By Category", styles["Heading2"]))
    story.append(_styled_table(_grouped_table(db, ward_id, Grievance.category, "Category")))
    story.append(Spacer(1, 12))
    story.append(Paragraph("By Ward", styles["Heading2"]))
    story.append(_styled_table(_grouped_table(db, ward_id, Grievance.ward_name, "Ward")))
    return story


def generate_report(report_type: str, db: Session, ward_id: int | None = None) -> dict:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    report_id = f"{report_type}-{now.strftime('%Y%m%d%H%M%S')}"
    file_path = REPORTS_DIR / f"{report_id}.pdf"
    doc = SimpleDocTemplate(str(file_path), pagesize=A4, title=f"UrbanMind {report_type.title()} Report")
    doc.build(_build_story(db, report_type, ward_id))
    return {
        "id": report_id,
        "type": report_type,
        "created_at": now.isoformat(),
        "file_url": f"/api/v1/reports/{report_id}/download",
    }
