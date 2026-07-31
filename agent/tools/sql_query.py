"""Read-only SQL query tool bound to the complaints table schema."""

from langchain_core.tools import tool
from sqlalchemy import create_engine, text

from agent import config

engine = create_engine(config.DATABASE_URL, pool_pre_ping=True)


@tool("sql_query")
def sql_query(query: str) -> list[dict]:
    """Execute a read-only SQL query against the UrbanMind PostgreSQL database.

    Only SELECT and WITH statements are allowed; anything else raises ValueError.
    Returns rows as a list of dicts keyed by column name. The main table is
    complaints(category, ward_name, ward_id, lat, lng, status, created_at).
    """
    statement = query.strip()
    if not statement.upper().startswith(("SELECT", "WITH")):
        raise ValueError("Only read-only SELECT/WITH queries are allowed.")
    with engine.connect() as conn:
        result = conn.execute(text(statement))
        return [dict(row) for row in result.mappings()]
