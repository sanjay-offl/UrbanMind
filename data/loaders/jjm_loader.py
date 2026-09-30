"""Jal Jeevan Mission (JJM) tap water coverage loader.

Source: Department of Drinking Water and Sanitation, Ministry of Jal Shakti (ejalshakti.gov.in)
License: GODL India
Tag: JJM_API
"""

import csv
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.bigquery_service import insert_rows


def load_jjm_data(raw_path: str | None = None) -> int:
    if raw_path is None:
        raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "raw", "jjm_district_coverage.csv"))

    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"JJM raw file not found at {raw_path}")

    rows_to_insert = []
    with open(raw_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cov = float(row["jjm_tap_coverage"])
            assert 0.0 <= cov <= 1.0, f"Coverage out of bounds: {cov}"

            rows_to_insert.append({
                "district_lgd_code": str(row["lgd_code"]).strip(),
                "district_name": row["district_name"],
                "state_code": row["state_code"],
                "indicator_name": "jjm_tap_coverage",
                "indicator_value": cov,
                "source_tag": "JJM_API",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

    count = insert_rows("infrastructure_indicators", rows_to_insert)
    print(f"[JJM_API] Loaded and validated {count} tap water coverage records into BigQuery.")
    return count


if __name__ == "__main__":
    load_jjm_data()
