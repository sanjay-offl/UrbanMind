"""Daily grievance-count trend analysis over the complaints table."""

from langchain_core.tools import tool
from sqlalchemy import text

from agent.tools.sql_query import engine


@tool("trend_analysis")
def trend_analysis(
    category: str | None = None,
    ward: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    """Count grievances per day, optionally filtered by category, ward name, and date range.

    Returns a chronologically sorted list of {"date": "YYYY-MM-DD", "count": int}.
    """
    clauses = []
    params = {}
    if category:
        clauses.append("category = :category")
        params["category"] = category
    if ward:
        clauses.append("ward_name = :ward")
        params["ward"] = ward
    if start_date:
        clauses.append("DATE(created_at) >= :start_date")
        params["start_date"] = start_date
    if end_date:
        clauses.append("DATE(created_at) <= :end_date")
        params["end_date"] = end_date
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = text(
        "SELECT DATE(created_at) AS date, COUNT(*) AS count "
        f"FROM complaints {where} "
        "GROUP BY DATE(created_at) ORDER BY date"
    )
    with engine.connect() as conn:
        rows = conn.execute(sql, params).mappings().all()
    return [{"date": str(row["date"]), "count": row["count"]} for row in rows]
