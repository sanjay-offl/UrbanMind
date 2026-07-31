from sqlalchemy import select

from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models import Ward

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


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(Ward).limit(1)) is None:
            db.add_all([Ward(**ward) for ward in HYDERABAD_WARDS])
            db.commit()
    finally:
        db.close()
