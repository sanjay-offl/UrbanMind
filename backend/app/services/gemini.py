"""Google Gemini access layer.

Single place that knows:
  * whether Google AI credentials are configured (otherwise: demo mode),
  * the real model names to report in API responses,
  * async batching (semaphore of 10) and exponential backoff on rate limits.

Nothing in this module ever labels heuristic output as a model result.  When the
service is unavailable callers must serve pre-computed demo data via
``app.services.demo_data`` and report ``demo_mode=True``.
"""

from __future__ import annotations

import asyncio
import json
import random
import warnings
from typing import Any

from app.config import settings

MAX_CONCURRENT_REQUESTS = 10
MAX_RETRIES = 4
BASE_BACKOFF_SECONDS = 0.5

_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

_RATE_LIMIT_MARKERS = (
    "429",
    "resource_exhausted",
    "resource exhausted",
    "rate limit",
    "ratelimit",
    "quota",
    "too many requests",
)

_MODEL_CACHE: dict[str, Any] = {}
_CONFIGURED_CLIENT: str | None = None


def is_demo_mode() -> bool:
    """True when no Google AI credential is configured.

    This is the single gate for the whole app. When True, no network call is
    ever attempted and callers must serve pre-computed demo data only.
    """
    return settings.is_demo_mode


def describe() -> dict[str, Any]:
    """Model metadata that every API response must report."""
    if is_demo_mode():
        return {
            "provider": "demo",
            "model": "none",
            "demo_mode": True,
            "embedding_model": "none",
            "note": "No GOOGLE_API_KEY/VERTEX_AI_PROJECT configured: serving pre-computed demo data.",
        }
    return {
        "provider": "google",
        "model": settings.gemini_model,
        "demo_mode": False,
        "embedding_model": settings.gemini_embedding_model,
        "note": None,
    }


def is_rate_limit_error(exc: BaseException) -> bool:
    text = str(exc).lower()
    status = getattr(exc, "code", None)
    if callable(status):
        try:
            text += " " + str(status()).lower()
        except Exception:  # pragma: no cover - defensive
            pass
    text += " " + type(exc).__name__.lower()
    return any(marker in text for marker in _RATE_LIMIT_MARKERS)


def _configure_clients() -> None:
    """Configure the Google AI client exactly once."""
    global _CONFIGURED_CLIENT
    signature = (settings.google_api_key, settings.vertex_ai_project, settings.vertex_ai_location)
    if _CONFIGURED_CLIENT == signature:  # pragma: no cover - trivial
        return
    if settings.google_api_key:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", FutureWarning)
            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
        _CONFIGURED_CLIENT = signature
        return
    if settings.vertex_ai_project:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", FutureWarning)
            import vertexai

            vertexai.init(project=settings.vertex_ai_project, location=settings.vertex_ai_location)
        _CONFIGURED_CLIENT = signature


def _generation_config(schema: dict[str, Any] | None) -> dict[str, Any]:
    """Generation config that forces structured JSON output from Gemini."""
    if schema is None:
        return {}
    return {"response_mime_type": "application/json", "response_schema": schema}


def _build_model(model_name: str, system: str | None, schema: dict[str, Any] | None) -> Any:
    generation_config = _generation_config(schema)

    if settings.google_api_key:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", FutureWarning)
            import google.generativeai as genai

            kwargs: dict[str, Any] = {"model_name": model_name}
            if system:
                kwargs["system_instruction"] = system
            if generation_config:
                kwargs["generation_config"] = generation_config
            return genai.GenerativeModel(**kwargs)

    from vertexai.generative_models import GenerativeModel

    kwargs = {"model_name": model_name}
    if system:
        kwargs["system_instruction"] = system
    if generation_config:
        kwargs["generation_config"] = generation_config
    return GenerativeModel(**kwargs)


def _get_model(model_name: str, system: str | None, schema: dict[str, Any] | None) -> Any:
    _configure_clients()
    key = (model_name, system or "", json.dumps(schema, sort_keys=True) if schema else "")
    cached = _MODEL_CACHE.get(key)
    if cached is None:
        cached = _build_model(model_name, system, schema)
        _MODEL_CACHE[key] = cached
    return cached


async def _generate_structured(
    prompt: str,
    *,
    schema: dict[str, Any] | None = None,
    model: str | None = None,
    system: str | None = None,
) -> str:
    """Low-level network call. Returns raw response text. Raised to the caller."""
    model_name = model or settings.gemini_model
    generative_model = _get_model(model_name, system, schema)
    response = await generative_model.generate_content_async(prompt)
    return response.text or ""


async def _backoff(attempt: int) -> None:
    delay = BASE_BACKOFF_SECONDS * (2**attempt) + random.uniform(0, 0.25)
    await asyncio.sleep(delay)


async def generate_json(
    prompt: str,
    *,
    schema: dict[str, Any] | None = None,
    model: str | None = None,
    system: str | None = None,
    max_retries: int = MAX_RETRIES,
) -> dict[str, Any]:
    """One Gemini call with structured JSON output, batched with a semaphore."""
    if is_demo_mode():
        raise GeminiNotConfigured(
            "Google AI is not configured (GOOGLE_API_KEY / VERTEX_AI_PROJECT missing)."
        )
    last_error: BaseException | None = None
    async with _semaphore:
        for attempt in range(max_retries + 1):
            try:
                raw = await _generate_structured(prompt, schema=schema, model=model, system=system)
                if isinstance(raw, dict):
                    return raw
                return _parse_json(raw)
            except GeminiNotConfigured:
                raise
            except Exception as exc:  # noqa: BLE001 - normalised below
                last_error = exc
                if not is_rate_limit_error(exc) or attempt >= max_retries:
                    break
                await _backoff(attempt)
    raise GeminiCallFailed(str(last_error) if last_error else "unknown Gemini error")


async def generate_text(
    prompt: str,
    *,
    model: str | None = None,
    system: str | None = None,
    max_retries: int = MAX_RETRIES,
) -> str:
    """Free-form Gemini call (no schema), same batching + backoff rules."""
    if is_demo_mode():
        raise GeminiNotConfigured(
            "Google AI is not configured (GOOGLE_API_KEY / VERTEX_AI_PROJECT missing)."
        )
    last_error: BaseException | None = None
    async with _semaphore:
        for attempt in range(max_retries + 1):
            try:
                return await _generate_structured(prompt, schema=None, model=model, system=system)
            except GeminiNotConfigured:
                raise
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if not is_rate_limit_error(exc) or attempt >= max_retries:
                    break
                await _backoff(attempt)
    raise GeminiCallFailed(str(last_error) if last_error else "unknown Gemini error")


async def generate_multimodal_json(
    prompt: str,
    image: bytes,
    mime_type: str,
    *,
    schema: dict[str, Any],
    model: str | None = None,
) -> dict[str, Any]:
    """Send a prompt and image to Gemini, enforcing JSON output and shared limits."""
    if is_demo_mode():
        raise GeminiNotConfigured("Google AI is not configured for multimodal intake.")
    last_error: BaseException | None = None
    async with _semaphore:
        for attempt in range(MAX_RETRIES + 1):
            try:
                generative_model = _get_model(model or settings.gemini_model, None, schema)
                image_part = {"mime_type": mime_type, "data": image}
                response = await generative_model.generate_content_async([prompt, image_part])
                raw = response.text or ""
                return raw if isinstance(raw, dict) else _parse_json(raw)
            except Exception as exc:  # noqa: BLE001 - match text generation retry policy
                last_error = exc
                if not is_rate_limit_error(exc) or attempt >= MAX_RETRIES:
                    break
                await _backoff(attempt)
    raise GeminiCallFailed(str(last_error) if last_error else "unknown Gemini error")


def _parse_json(raw: str) -> dict[str, Any]:
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[5:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if 0 <= start < end:
            parsed = json.loads(cleaned[start : end + 1])
        else:
            raise
    if not isinstance(parsed, dict):
        raise GeminiCallFailed("Gemini returned a non-object JSON payload")
    return parsed


class GeminiNotConfigured(RuntimeError):
    """Raised when the app is running in demo mode and a live call is attempted."""


class GeminiCallFailed(RuntimeError):
    """Raised when a live Gemini call fails after retries."""
