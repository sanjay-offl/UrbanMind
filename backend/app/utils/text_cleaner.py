import re

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_EMAIL_RE = re.compile(r"\S+@\S+\.\S+")
_PUNCT_RE = re.compile(r"[^\w\s.,!?;:'\"()-]")
_WS_RE = re.compile(r"\s+")


def clean(text: str) -> str:
    if not text:
        return ""
    cleaned = _URL_RE.sub(" ", str(text))
    cleaned = _EMAIL_RE.sub(" ", cleaned)
    cleaned = _PUNCT_RE.sub(" ", cleaned)
    cleaned = _WS_RE.sub(" ", cleaned)
    return cleaned.strip().lower()


def truncate(text: str, max_len: int = 2000) -> str:
    if not text:
        return ""
    return text if len(text) <= max_len else text[:max_len].rstrip() + "..."
