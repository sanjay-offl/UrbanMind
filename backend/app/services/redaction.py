"""PII redaction applied to ``original_text`` *before* storage.

Order of execution:
  1. Google Sensitive Data Protection (Cloud DLP) when credentials are available.
  2. A Gemini redaction pass when DLP is unavailable but Gemini is configured.
  3. A deterministic local regex pass (phone + Aadhaar patterns) as the offline
     safety net — explicitly labelled ``regex`` so it is never mistaken for a
     cloud service.

Only runs when the classifier reported ``pii_detected=True``.
"""

from __future__ import annotations

import re
from typing import Any

from app.config import settings
from app.services import gemini

METHOD_NONE = "none"
METHOD_DLP = "dlp"
METHOD_GEMINI = "gemini"
METHOD_REGEX = "regex"

# Indian mobile numbers (10 digits, starting 6-9) with optional +91 prefix.
_PHONE_PATTERN = r"(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}"
# Aadhaar: 12 digits, optionally written in XXXX XXXX XXXX groups.
_AADHAAR_PATTERN = r"\b(?:\d{4}[\s-]?){2}\d{4}\b"
# Standalone 12 digit sequences (account/passport style).
_LONG_DIGIT_PATTERN = r"\b\d{12}\b"

REDACTION_MASK = "[REDACTED]"

_COMPILED = [
    re.compile(_AADHAAR_PATTERN),
    re.compile(_LONG_DIGIT_PATTERN),
    re.compile(_PHONE_PATTERN),
]

# Conservative full-name patterns: "My name is X", "name: X", "I am X Kumar".
_NAME_PATTERNS = [
    re.compile(r"\b(?:my name is|i am|name is|this is|caller[: ]+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})", re.IGNORECASE),
    re.compile(r"\bname\s*[:=-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})"),
]

_GEMINI_REDACTION_PROMPT = (
    "Redact personally identifying information from the text below. Replace every "
    "full personal name, phone number and Aadhaar-like 12 digit number with the "
    "token [REDACTED]. Keep every other word exactly as written. Return JSON with a "
    "single key `redacted_text`.\n\n---\n{text}\n---"
)

_GEMINI_REDACTION_SCHEMA = {
    "type": "object",
    "properties": {"redacted_text": {"type": "string"}},
    "required": ["redacted_text"],
}


def _regex_redact(text: str) -> str:
    redacted = text
    for pattern in _COMPILED:
        redacted = pattern.sub(REDACTION_MASK, redacted)
    for pattern in _NAME_PATTERNS:
        redacted = pattern.sub(
            lambda match: match.group(0).replace(match.group(1), REDACTION_MASK),
            redacted,
        )
    return redacted


def _dlp_redact(text: str) -> str:
    from google.cloud import dlp_v2

    client = dlp_v2.DlpServiceClient()
    project = settings.vertex_ai_project or settings.firebase_project_id
    if not project:
        raise RuntimeError("DLP requires a Google Cloud project id")
    parent = f"projects/{project}/locations/global"
    inspect_config = {
        "info_types": [
            {"name": "PHONE_NUMBER"},
            {"name": "PERSON_NAME"},
            {"name": "EMAIL_ADDRESS"},
            {"name": "INDIA_AADHAAR"},
            {"name": "INDIA_PAN"},
        ],
        "include_quote": True,
    }
    deidentify_config = {
        "info_type_transformations": {
            "transformations": [
                {"primitive_transformation": {"replace_config": {"replacement_value": REDACTION_MASK}}}
            ]
        }
    }
    response = client.deidentify_content(
        request={
            "parent": parent,
            "item": {"value": text},
            "deidentify_config": deidentify_config,
            "inspect_config": inspect_config,
        }
    )
    return response.item.value


async def _gemini_redact(text: str) -> str:
    payload = await gemini.generate_json(
        _GEMINI_REDACTION_PROMPT.format(text=text),
        schema=_GEMINI_REDACTION_SCHEMA,
        system="You are a privacy redaction service. Output JSON only.",
    )
    redacted = payload.get("redacted_text")
    return redacted if isinstance(redacted, str) and redacted else text


def redact_regex_only(text: str) -> str:
    """Public helper used by tests and by offline storage paths."""
    return _regex_redact(text)


def _dlp_available() -> bool:
    import os

    return bool(
        settings.vertex_ai_project or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    ) and not gemini.is_demo_mode()


async def redact_text(text: str, pii_detected: bool) -> tuple[str, bool, str]:
    """Return ``(redacted_text, pii_redacted, method)``."""
    if not pii_detected or not text:
        return text, False, METHOD_NONE

    if _dlp_available():
        try:
            return _dlp_redact(text), True, METHOD_DLP
        except Exception:  # noqa: BLE001 - fall through to Gemini
            pass

    if not gemini.is_demo_mode():
        try:
            return await _gemini_redact(text), True, METHOD_GEMINI
        except Exception:  # noqa: BLE001 - fall through to regex
            pass

    return _regex_redact(text), True, METHOD_REGEX
