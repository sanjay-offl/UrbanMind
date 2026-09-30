"""Census 2011 district totals loader.

Source: Office of Registrar General & Census Commissioner, India (censusindia.gov.in)
License: Government Open Data License - India (GODL)
Tag: CENSUS_2011
"""

import csv
import os
import sys

# Add backend to path so we can import bigquery_service
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.bigquery_service import insert_rows


def load_census_data(raw_path: str | None = None) -> int:
    if raw_path is None:
        raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "raw", "census_2011_district.csv"))

    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Census raw file not found at {raw_path}")

    rows_to_insert = []
    with open(raw_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Validation
            lgd_code = str(row["lgd_code"]).strip()
            total_pop = int(row["total_population"])
            assert total_pop > 0, f"Invalid population {total_pop} for {row['district_name']}"
            assert 0.0 <= float(row["rural_pct"]) <= 100.0
            assert 0.0 <= float(row["literacy_rate"]) <= 100.0

            rows_to_insert.append({
                "lgd_code": lgd_code,
                "district_name": row["district_name"],
                "state_code": row["state_code"],
                "state_name": row.get("state_name", ""),
                "total_population": total_pop,
                "rural_pct": float(row["rural_pct"]),
                "sc_pct": float(row["sc_pct"]),
                "st_pct": float(row["st_pct"]),
                "literacy_rate": float(row["literacy_rate"]),
                "sex_ratio": int(row["sex_ratio"]),
                "source_tag": "CENSUS_2011",
            })

    count = insert_rows("demographics", rows_to_insert)
    print(f"[CENSUS_2011] Loaded and validated {count} district records into BigQuery demographics.")
    return count


if __name__ == "__main__":
    load_census_data()
