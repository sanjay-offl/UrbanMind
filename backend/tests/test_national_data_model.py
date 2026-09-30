"""Tests for Phase 3: National Data Model, Admin Units, BigQuery analytics, and Synthetic Corpus."""

import csv
import json
import os
import pytest
from sqlalchemy import select

from app.models import AdminUnit, Grievance
from app.services.bigquery_service import run_bigquery_sql, insert_rows


def test_admin_unit_hierarchy_and_attributes(db_session):
    # Create Country
    india = AdminUnit(id=101, parent_id=None, level="country", name="India", state_code="IN", lgd_code="1")
    db_session.add(india)
    
    # Create State
    tn = AdminUnit(id=102, parent_id=101, level="state", name="Tamil Nadu", state_code="TN", lgd_code="33")
    db_session.add(tn)
    
    # Create District with GeoJSON
    polygon = json.dumps({"type": "Polygon", "coordinates": [[[77.9, 10.3], [78.1, 10.3], [78.1, 10.5], [77.9, 10.5], [77.9, 10.3]]]})
    dindigul = AdminUnit(
        id=103,
        parent_id=102,
        level="district",
        name="Dindigul",
        state_code="TN",
        lgd_code="33007",
        lat=10.3673,
        lng=77.9803,
        population_2011=2159775,
        geojson=polygon,
    )
    db_session.add(dindigul)
    db_session.commit()

    queried_district = db_session.scalar(select(AdminUnit).where(AdminUnit.name == "Dindigul"))
    assert queried_district is not None
    assert queried_district.level == "district"
    assert queried_district.parent_id == 102
    assert queried_district.population == 2159775
    assert json.loads(queried_district.geojson)["type"] == "Polygon"


def test_bigquery_public_indicators_and_sql():
    # Test BigQuery transparent query execution on demographics and indicators
    query = """
    SELECT d.district_name, d.state_code, d.total_population, d.rural_pct
    FROM demographics d
    LIMIT 5
    """
    results = run_bigquery_sql(query)
    assert isinstance(results, list)
    assert len(results) > 0
    first = results[0]
    assert "district_name" in first
    assert "total_population" in first
    assert int(first["total_population"]) > 0


def test_synthetic_requests_corpus_and_eval_set():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    synthetic_path = os.path.join(base_dir, "data", "synthetic_requests.csv")
    eval_path = os.path.join(base_dir, "data", "eval_set.csv")

    assert os.path.exists(synthetic_path), "synthetic_requests.csv must exist"
    assert os.path.exists(eval_path), "eval_set.csv must exist"

    # Verify synthetic corpus size and diversity
    with open(synthetic_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        synthetic_rows = list(reader)

    assert len(synthetic_rows) >= 5000, f"Expected >= 5000 rows, got {len(synthetic_rows)}"

    languages = set(row["language"] for row in synthetic_rows)
    states = set(row["state"] for row in synthetic_rows)
    sources = set(row["source"] for row in synthetic_rows)

    assert len(languages) >= 8, f"Expected at least 8 languages, got {len(languages)}"
    assert "SYNTHETIC" in sources
    assert all(row["source"] == "SYNTHETIC" for row in synthetic_rows)
    assert {"Tamil Nadu", "Uttar Pradesh", "Maharashtra", "Assam"}.issubset(states)

    # Verify 300 rows held-out eval set
    with open(eval_path, "r", encoding="utf-8") as f:
        eval_rows = list(csv.DictReader(f))

    assert len(eval_rows) == 300, f"Expected exactly 300 eval rows, got {len(eval_rows)}"
    for row in eval_rows:
        assert row["complaint_text"].strip()
        assert row["english_translation"].strip()
        assert row["sector"] in ["water", "roads", "sanitation", "electricity", "health", "education", "agriculture", "public_safety", "transport", "environment", "housing", "digital_connectivity", "other"]
        assert 1 <= int(row["urgency"]) <= 5
