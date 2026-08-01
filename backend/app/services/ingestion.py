import re
import unicodedata
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

_TAMIL_VOWELS = {
    "\u0b85": "a", "\u0b86": "aa", "\u0b87": "i", "\u0b88": "ii",
    "\u0b89": "u", "\u0b8a": "uu", "\u0b8e": "e", "\u0b8f": "ee",
    "\u0b90": "ai", "\u0b92": "o", "\u0b93": "oo", "\u0b94": "au",
}
_TAMIL_CONSONANTS = {
    "\u0b95": "k", "\u0b99": "ng", "\u0b9a": "ch", "\u0b9e": "nj",
    "\u0b9f": "t", "\u0ba3": "n", "\u0ba4": "th", "\u0ba8": "n",
    "\u0baa": "p", "\u0bae": "m", "\u0baf": "y", "\u0bb0": "r",
    "\u0bb2": "l", "\u0bb5": "v", "\u0bb4": "zh", "\u0bb3": "l",
    "\u0bb1": "r", "\u0ba9": "n",
}
_TAMIL_SIGNS = {
    "\u0bbe": "aa", "\u0bbf": "i", "\u0bc0": "ii", "\u0bc1": "u",
    "\u0bc2": "uu", "\u0bc6": "e", "\u0bc7": "ee", "\u0bc8": "ai",
    "\u0bca": "o", "\u0bcb": "oo", "\u0bcc": "au", "\u0bcd": "",
}
_DEVANAGARI_VOWELS = {
    "\u0905": "a", "\u0906": "aa", "\u0907": "i", "\u0908": "ii",
    "\u0909": "u", "\u090a": "uu", "\u090b": "ri", "\u090f": "e",
    "\u0910": "ai", "\u0913": "o", "\u0914": "au",
}
_DEVANAGARI_CONSONANTS = {
    "\u0915": "k", "\u0916": "kh", "\u0917": "g", "\u0918": "gh",
    "\u0919": "ng", "\u091a": "ch", "\u091b": "chh", "\u091c": "j",
    "\u091d": "jh", "\u091e": "ny", "\u091f": "t", "\u0920": "th",
    "\u0921": "d", "\u0922": "dh", "\u0923": "n", "\u0924": "t",
    "\u0925": "th", "\u0926": "d", "\u0927": "dh", "\u0928": "n",
    "\u092a": "p", "\u092b": "ph", "\u092c": "b", "\u092d": "bh",
    "\u092e": "m", "\u092f": "y", "\u0930": "r", "\u0932": "l",
    "\u0935": "v", "\u0936": "sh", "\u0937": "sh", "\u0938": "s",
    "\u0939": "h",
}
_DEVANAGARI_SIGNS = {
    "\u093e": "aa", "\u093f": "i", "\u0940": "ii", "\u0941": "u",
    "\u0942": "uu", "\u0943": "ri", "\u0947": "e", "\u0948": "ai",
    "\u094b": "o", "\u094c": "au", "\u094d": "", "\u0945": "e",
    "\u093c": "",
}
_EXTRA_DROPS = {"\u0964": ".", "\u0965": "."}


def _transliterate(text: str) -> str:
    """Best-effort transliteration of Tamil/Devanagari Unicode to ASCII."""
    out: list[str] = []
    for char in text:
        if char in _TAMIL_SIGNS:
            out.append(_TAMIL_SIGNS[char])
        elif char in _TAMIL_CONSONANTS:
            out.append(_TAMIL_CONSONANTS[char])
        elif char in _TAMIL_VOWELS:
            out.append(_TAMIL_VOWELS[char])
        elif char in _DEVANAGARI_SIGNS:
            out.append(_DEVANAGARI_SIGNS[char])
        elif char in _DEVANAGARI_CONSONANTS:
            out.append(_DEVANAGARI_CONSONANTS[char])
        elif char in _DEVANAGARI_VOWELS:
            out.append(_DEVANAGARI_VOWELS[char])
        elif char in _EXTRA_DROPS:
            out.append(_EXTRA_DROPS[char])
        else:
            out.append(char)
    return "".join(out)


def clean_complaint_text(raw: str | None) -> str:
    """Normalize a single complaint: strip, collapse whitespace, transliterate."""
    if raw is None:
        return ""
    text = unicodedata.normalize("NFKC", str(raw))
    text = _transliterate(text)
    text = text.replace("\r", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    text = text.strip()
    if len(text) < 10:
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

        ward_name = ""
        if ward_col is not None and not pd.isna(record[ward_col]):
            ward_name = clean(str(record[ward_col]))
        elif "ward_name" in df.columns and not pd.isna(record["ward_name"]):
            ward_name = clean(str(record["ward_name"]))

        rows.append(
            {
                "title": truncate(clean(cleaned)),
                "description": truncate(clean(cleaned)),
                "ward_name": ward_name,
                "latitude": _to_float(record[lat_col]) if lat_col else None,
                "longitude": _to_float(record[lng_col]) if lng_col else None,
                "source": clean(str(record[source_col])) if source_col and not pd.isna(record[source_col]) else "csv",
                "created_at": _to_datetime(record[date_col]) if date_col else None,
            }
        )
    return rows, errors
