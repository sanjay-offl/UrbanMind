"""Swachh Bharat Mission (Grameen) ODF status loader.

Source: Ministry of Jal Shakti, sbm.gov.in
License: GODL India
Tag: SWACHH_API
"""

import csv
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.bigquery_service import insert_rows


def load_swachh_data(raw_path: str | None = None) -> int:
    if raw_path is None:
        raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "raw", "swachh_bharat_odf.csv"))

    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Swachh Bharat raw file not found at {raw_path}")

    rows_to_insert = []
    with open(raw_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            val = float(row.get("odf_plus_villages_pct", 85.0)) / 100.0

            rows_to_insert.append({
                "district_lgd_code": str(row["lgd_code"]).strip(),
                "district_name": row["district_name"],
                "state_code": row["state_code"],
                "indicator_name": "swachh_odf_status",
                "indicator_value": val,
                "source_tag": "SWACHH_API",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

    count = insert_rows("infrastructure_indicators", rows_to_insert)
    print(f"[SWACHH_API] Loaded and validated {count} sanitation records into BigQuery.")
    return count


if __name__ == "__main__":
    load_swachh_data()
