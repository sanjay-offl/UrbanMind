"""NITI Aayog Aspirational Districts list and composite scores loader.

Source: NITI Aayog Aspirational Districts Programme (niti.gov.in)
License: GODL India
Tag: NITI_AAYOG
"""

import csv
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.bigquery_service import insert_rows


def load_niti_data(raw_path: str | None = None) -> int:
    if raw_path is None:
        raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "raw", "niti_aspirational_districts.csv"))

    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"NITI Aayog raw file not found at {raw_path}")

    rows_to_insert = []
    with open(raw_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            score = float(row["composite_score"])
            assert 0.0 <= score <= 100.0, f"Score out of bounds: {score}"

            rows_to_insert.append({
                "district_lgd_code": str(row["lgd_code"]).strip(),
                "district_name": row["district_name"],
                "state_code": row["state_code"],
                "indicator_name": "aspirational_district_composite_score",
                "indicator_value": score / 100.0,
                "source_tag": "NITI_AAYOG",
                "updated_at": "2026-09-01T00:00:00Z",
            })

    count = insert_rows("infrastructure_indicators", rows_to_insert)
    print(f"[NITI_AAYOG] Loaded and validated {count} aspirational districts records into BigQuery.")
    return count


if __name__ == "__main__":
    load_niti_data()
