"""Pradhan Mantri Gram Sadak Yojana (PMGSY) road connectivity loader.

Source: Ministry of Rural Development, omms.nic.in
License: GODL India
Tag: PMGSY_API
"""

import csv
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.bigquery_service import insert_rows


def load_pmgsy_data(raw_path: str | None = None) -> int:
    if raw_path is None:
        raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "raw", "pmgsy_road_connectivity.csv"))

    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"PMGSY raw file not found at {raw_path}")

    rows_to_insert = []
    with open(raw_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cov = float(row["pmgsy_road_connected"])
            assert 0.0 <= cov <= 1.0, f"Road coverage out of bounds: {cov}"

            rows_to_insert.append({
                "district_lgd_code": str(row["lgd_code"]).strip(),
                "district_name": row["district_name"],
                "state_code": row["state_code"],
                "indicator_name": "pmgsy_road_connected",
                "indicator_value": cov,
                "source_tag": "PMGSY_API",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

    count = insert_rows("infrastructure_indicators", rows_to_insert)
    print(f"[PMGSY_API] Loaded and validated {count} road connectivity records into BigQuery.")
    return count


if __name__ == "__main__":
    load_pmgsy_data()
