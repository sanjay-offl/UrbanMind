"""Report generation tool that delegates to the backend reporting service."""

import requests
from langchain_core.tools import tool

from agent import config

REPORT_TYPES = ("weekly_summary", "priority_ranking", "category_report")


@tool("generate_report")
def generate_report(type: str, ward_id: int) -> dict:
    """Generate a municipal report for a ward via the backend reporting service.

    type is one of: weekly_summary, priority_ranking, category_report.
    Returns report metadata plus a file_url to download the generated report.
    """
    url = f"{config.report_backend_url}/api/v1/reports/generate"
    response = requests.post(url, json={"type": type, "ward_id": ward_id}, timeout=120)
    response.raise_for_status()
    payload = response.json()
    return {
        "report_id": payload.get("id"),
        "type": payload.get("type"),
        "status": payload.get("status"),
        "file_url": payload.get("file_url"),
    }
