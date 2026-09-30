import json
import os
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models import AdminUnit, Grievance
from app.utils.geo_lookup import haversine_km

HYDERABAD_WARDS = [
    {"name": "Begumpet", "code": "W001", "lat": 17.4493, "lng": 78.4740, "population": 48000},
    {"name": "Ameerpet", "code": "W002", "lat": 17.4375, "lng": 78.4483, "population": 52000},
    {"name": "Kukatpally", "code": "W003", "lat": 17.4948, "lng": 78.4074, "population": 110000},
    {"name": "Madhapur", "code": "W004", "lat": 17.4483, "lng": 78.3915, "population": 95000},
    {"name": "Gachibowli", "code": "W005", "lat": 17.4401, "lng": 78.3489, "population": 88000},
    {"name": "Secunderabad", "code": "W006", "lat": 17.4399, "lng": 78.4983, "population": 125000},
    {"name": "Charminar", "code": "W007", "lat": 17.3616, "lng": 78.4747, "population": 132000},
    {"name": "Banjara Hills", "code": "W008", "lat": 17.4189, "lng": 78.4407, "population": 61000},
    {"name": "Jubilee Hills", "code": "W009", "lat": 17.4319, "lng": 78.4120, "population": 57000},
    {"name": "Hitech City", "code": "W010", "lat": 17.4448, "lng": 78.3865, "population": 74000},
    {"name": "Tarnaka", "code": "W011", "lat": 17.4409, "lng": 78.5496, "population": 69000},
    {"name": "Dilsukhnagar", "code": "W012", "lat": 17.3694, "lng": 78.5243, "population": 140000},
]


def seed_admin_units(db: Session) -> None:
    """Seed India with 36 states and UTs, 766 districts from the LGD codelist."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    json_path = os.path.join(base_dir, "..", "data", "raw", "india_admin_units.json")
    if not os.path.exists(json_path):
        json_path = os.path.join(base_dir, "data", "raw", "india_admin_units.json")

    units_data = []
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            units_data = json.load(f)

    if not units_data:
        # Fallback minimal seed
        units_data = [
            {"id": 1, "parent_id": None, "level": "country", "name": "India", "state_code": "IN", "lat": 20.5937, "lng": 78.9629, "population_2011": 1210854977},
            {"id": 2, "parent_id": 1, "level": "state", "name": "Telangana", "state_code": "TG", "lat": 18.1124, "lng": 79.0193, "population_2011": 35003674},
            {"id": 3, "parent_id": 2, "level": "district", "name": "Hyderabad", "state_code": "TG", "lat": 17.3850, "lng": 78.4867, "population_2011": 3943323},
        ]

    # Insert national administrative units
    max_id = 0
    for u in units_data:
        u_id = int(u.get("id", 0))
        max_id = max(max_id, u_id)
        unit = AdminUnit(
            id=u_id,
            parent_id=u.get("parent_id"),
            level=u.get("level", "district"),
            lgd_code=str(u.get("lgd_code") or ""),
            name=u.get("name", ""),
            state_code=u.get("state_code"),
            lat=u.get("lat"),
            lng=u.get("lng"),
            population_2011=u.get("population_2011"),
            geojson=u.get("geojson"),
        )
        db.merge(unit)
    db.commit()

    # Find Hyderabad district ID
    hyd = db.scalar(select(AdminUnit).where(AdminUnit.name == "Hyderabad").limit(1))
    hyd_id = hyd.id if hyd else 3

    # Seed wards as block/ward level units under Hyderabad district
    for w in HYDERABAD_WARDS:
        existing = db.scalar(select(AdminUnit).where(AdminUnit.name == w["name"]).limit(1))
        if not existing:
            max_id += 1
            ward_unit = AdminUnit(
                id=max_id,
                parent_id=hyd_id,
                level="ward",
                lgd_code=w["code"],
                name=w["name"],
                state_code="TG",
                lat=w["lat"],
                lng=w["lng"],
                population_2011=w["population"],
            )
            db.add(ward_unit)
    db.commit()


def migrate_grievances_to_districts(db: Session) -> None:
    """Migrate existing grievances to map to the nearest district."""
    districts = db.scalars(select(AdminUnit).where(AdminUnit.level == "district")).all()
    if not districts:
        return

    unmapped = db.scalars(select(Grievance).where(Grievance.admin_unit_id.is_(None))).all()
    for g in unmapped:
        if g.lat and g.lng and (g.lat != 0.0 or g.lng != 0.0):
            nearest = min(districts, key=lambda d: haversine_km((g.lat, g.lng), (d.lat, d.lng)) if d.lat and d.lng else 999999)
            g.admin_unit_id = nearest.id
            if not g.district:
                g.district = nearest.name
            if not g.state:
                g.state = nearest.state_code
        else:
            # Map by matching ward_name or district
            matched = next((d for d in districts if d.name.lower() == g.ward_name.lower()), districts[0])
            g.admin_unit_id = matched.id
            if not g.district:
                g.district = matched.name
            if not g.state:
                g.state = matched.state_code
    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(AdminUnit).limit(1)) is None:
            seed_admin_units(db)
        migrate_grievances_to_districts(db)
    finally:
        db.close()
