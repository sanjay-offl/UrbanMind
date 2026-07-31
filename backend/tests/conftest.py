import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["PINECONE_API_KEY"] = ""
os.environ["CLAUDE_MODEL"] = "claude-sonnet-4-6"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models import Grievance, Ward

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionTesting = sessionmaker(bind=engine, autoflush=False, autocommit=False)

WARDS = [
    {"name": "Begumpet", "code": "W001", "lat": 17.4493, "lng": 78.4740, "population": 48000},
    {"name": "Ameerpet", "code": "W002", "lat": 17.4375, "lng": 78.4483, "population": 52000},
    {"name": "Kukatpally", "code": "W003", "lat": 17.4948, "lng": 78.4074, "population": 110000},
]

SAMPLE_GRIEVANCES = [
    {
        "title": "Deep pothole on Begumpet main road",
        "description": "A large pothole near the flyover is damaging vehicles.",
        "ward_id": 1,
        "ward_name": "Begumpet",
        "category": "Roads & Infrastructure",
        "status": "pending",
        "priority": "medium",
        "score": 55.0,
        "sentiment": "negative",
    },
    {
        "title": "No water supply in Ameerpet colony",
        "description": "Residents have had no water for two days.",
        "ward_id": 2,
        "ward_name": "Ameerpet",
        "category": "Water Supply",
        "status": "classified",
        "priority": "high",
        "score": 70.0,
        "sentiment": "negative",
    },
    {
        "title": "Garbage not collected for a week",
        "description": "Waste is piling up on the street corner.",
        "ward_id": 3,
        "ward_name": "Kukatpally",
        "category": "Sanitation & Waste",
        "status": "in_progress",
        "priority": "medium",
        "score": 45.0,
        "sentiment": "negative",
    },
    {
        "title": "Streetlight not working",
        "description": "Three streetlights are out since last week.",
        "ward_id": 1,
        "ward_name": "Begumpet",
        "category": "Electricity",
        "status": "resolved",
        "priority": "low",
        "score": 25.0,
        "sentiment": "neutral",
    },
    {
        "title": "Playground equipment broken",
        "description": "Swing chains in the park are broken.",
        "ward_id": 2,
        "ward_name": "Ameerpet",
        "category": "Parks & Green Spaces",
        "status": "closed",
        "priority": "low",
        "score": 20.0,
        "sentiment": "neutral",
    },
]


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionTesting()
    session.add_all([Ward(**ward) for ward in WARDS])
    for item in SAMPLE_GRIEVANCES:
        session.add(
            Grievance(
                **item,
                lat=0.0,
                lng=0.0,
                source="csv",
                created_at=datetime.utcnow() - timedelta(days=2),
            )
        )
    session.commit()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.processing.SessionLocal", SessionTesting)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
