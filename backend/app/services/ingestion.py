from io import StringIO

import pandas as pd

from app.utils.text_cleaner import clean, truncate

REQUIRED_COLUMNS = ["title", "description", "ward_name"]


def _to_float(value):
    if value is None:
        return None
    try:
        parsed = float(value)
        return None if pd.isna(parsed) else parsed
    except (TypeError, ValueError):
        return None


def _to_datetime(value):
    if value is None or value == "":
        return None
    try:
        parsed = pd.to_datetime(value, errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime()
    except (TypeError, ValueError):
        return None


def parse_csv(content: bytes) -> tuple[list[dict], list[str]]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return [], ["File is not valid UTF-8 text"]
    try:
        df = pd.read_csv(StringIO(text))
    except Exception as exc:
        return [], [f"Could not parse CSV: {exc}"]
    if df.empty:
        return [], ["CSV file is empty"]
    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        return [], [f"Missing required columns: {', '.join(missing)}"]
    rows: list[dict] = []
    errors: list[str] = []
    for index, record in df.iterrows():
        row = record.to_dict()
        title = clean(str(row.get("title", ""))) if not pd.isna(row.get("title")) else ""
        ward_name = clean(str(row.get("ward_name", ""))) if not pd.isna(row.get("ward_name")) else ""
        if not title or not ward_name:
            errors.append(f"Row {index + 1}: missing title or ward_name")
            continue
        rows.append(
            {
                "title": title,
                "description": truncate(clean(str(row.get("description", "")))),
                "ward_name": ward_name,
                "latitude": _to_float(row.get("latitude")),
                "longitude": _to_float(row.get("longitude")),
                "source": clean(str(row.get("source", "csv"))) or "csv",
                "created_at": _to_datetime(row.get("created_at")),
            }
        )
    return rows, errors
