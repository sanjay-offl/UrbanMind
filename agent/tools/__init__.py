"""Agent tools: sql_query, trend_analysis, ward_lookup, generate_report."""

from agent.tools.map_tool import nearest_ward, ward_lookup
from agent.tools.report_tool import generate_report
from agent.tools.sql_query import sql_query
from agent.tools.trend_tool import trend_analysis

sql_query_tool = sql_query
trend_tool = trend_analysis
map_tool = ward_lookup
report_tool = generate_report

__all__ = [
    "sql_query_tool",
    "trend_tool",
    "map_tool",
    "report_tool",
    "nearest_ward",
    "sql_query",
    "trend_analysis",
    "ward_lookup",
    "generate_report",
]
