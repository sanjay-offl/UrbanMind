"""Ward lookup and nearest-ward tools with a haversine distance helper."""

import math

from langchain_core.tools import tool
from sqlalchemy import text

from agent.tools.sql_query import engine


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres between two lat/lng points."""
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))


@tool("ward_lookup")
def ward_lookup(ward_name: str) -> dict:
    """Look up a ward by name and return its id, lat, lng, and complaint count."""
    sql = text(
        """
        SELECT w.id, w.name, w.lat, w.lng, COUNT(c.id) AS complaint_count
        FROM wards w
        LEFT JOIN complaints c ON c.ward_id = w.id
        WHERE w.name ILIKE :name
        GROUP BY w.id, w.name, w.lat, w.lng
        """
    )
    with engine.connect() as conn:
        row = conn.execute(sql, {"name": f"%{ward_name}%"}).mappings().first()
    if row is None:
        return {"ward_name": ward_name, "found": False}
    return {
        "ward_name": row["name"],
        "ward_id": row["id"],
        "lat": row["lat"],
        "lng": row["lng"],
        "complaint_count": row["complaint_count"],
        "found": True,
    }


@tool("nearest_ward")
def nearest_ward(lat: float, lng: float) -> dict:
    """Return the ward nearest to the given coordinates, with distance in km."""
    with engine.connect() as conn:
        wards = conn.execute(text("SELECT id, name, lat, lng FROM wards")).mappings().all()
    best = None
    best_distance = float("inf")
    for ward in wards:
        distance = haversine(lat, lng, ward["lat"], ward["lng"])
        if distance < best_distance:
            best_distance = distance
            best = ward
    if best is None:
        return {"found": False}
    return {
        "ward_name": best["name"],
        "ward_id": best["id"],
        "distance_km": round(best_distance, 2),
        "found": True,
    }
