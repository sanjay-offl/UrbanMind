import re
from io import StringIO

import pandas as pd

from app.utils.text_cleaner import clean, truncate

REQUIRED_COLUMNS = ["title", "description", "ward_name"]

TEXT_COLUMN_VARIANTS = [
    "complaint_text",
    "complaint",
    "text",
    "description",
    "message",
    "content",
    "grievance",
    "issue",
    "body",
    "details",
]
WARD_COLUMN_VARIANTS = ["ward", "ward_name", "area", "locality", "zone"]
DATE_COLUMN_VARIANTS = ["date", "created_at", "created_date", "timestamp"]
LAT_COLUMN_VARIANTS = ["latitude", "lat"]
LNG_COLUMN_VARIANTS = ["longitude", "lng", "lon"]
SOURCE_COLUMN_VARIANTS = ["source"]

MIN_TEXT_LENGTH = 10


def clean_complaint_text(raw: str | None) -> str:
    """Normalize whitespace only.

    Original Unicode is preserved exactly — there is no transliteration step.
    Multilingual understanding is handled by the Gemini classifier.
    """
    if raw is None:
        return ""
    text = str(raw).replace("\r", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    text = text.strip()
    if len(text) < MIN_TEXT_LENGTH:
        return ""
    return text


def _pick_column(df: pd.DataFrame, variants: list[str], default: str | None) -> str | None:
    for variant in variants:
        if variant in df.columns:
            return variant
    return default


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


def _ward_name(raw) -> str:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return ""
    return re.sub(r"\s+", " ", str(raw)).strip().lower()


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

    # Flexible column detection: prefer an explicit title column, then the
    # common complaint-text variants, otherwise fall back to the first column.
    text_col = _pick_column(df, ["title"], None) or _pick_column(df, TEXT_COLUMN_VARIANTS, None) or df.columns[0]
    description_col = _pick_column(df, ["description", "details", "body"], None)
    if description_col == text_col:
        description_col = None
    ward_col = _pick_column(df, WARD_COLUMN_VARIANTS, None)
    date_col = _pick_column(df, DATE_COLUMN_VARIANTS, None)
    lat_col = _pick_column(df, LAT_COLUMN_VARIANTS, None)
    lng_col = _pick_column(df, LNG_COLUMN_VARIANTS, None)
    source_col = _pick_column(df, SOURCE_COLUMN_VARIANTS, None)

    rows: list[dict] = []
    errors: list[str] = []
    for index, record in df.iterrows():
        raw = "" if pd.isna(record[text_col]) else str(record[text_col])
        cleaned = clean_complaint_text(raw)
        if not cleaned:
            errors.append(f"Row {index + 1}: skipped (missing or too short complaint text)")
            continue
        raw_description = (
            "" if description_col is None or pd.isna(record[description_col])
            else str(record[description_col])
        )
        description = clean_complaint_text(raw_description) if raw_description else cleaned

        ward_name = ""
        if ward_col is not None and not pd.isna(record[ward_col]):
            ward_name = _ward_name(record[ward_col])
        elif "ward_name" in df.columns and not pd.isna(record["ward_name"]):
            ward_name = _ward_name(record["ward_name"])

        rows.append(
            {
                "title": truncate(cleaned.lower(), 255),
                "description": truncate(description),
                "ward_name": ward_name,
                "latitude": _to_float(record[lat_col]) if lat_col else None,
                "longitude": _to_float(record[lng_col]) if lng_col else None,
                "source": clean(str(record[source_col])) if source_col and not pd.isna(record[source_col]) else "csv",
                "created_at": _to_datetime(record[date_col]) if date_col else None,
            }
        )
    return rows, errors
