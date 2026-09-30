"""Phase 1 tests: the Gemini structured-output classifier."""

import json

import pytest

from app.services import classifier, gemini

SCHEMA_KEYS = {
    "detected_language",
    "language_confidence",
    "original_text",
    "english_summary",
    "sector",
    "subcategory",
    "urgency",
    "sentiment",
    "location_mentions",
    "vulnerable_group_flags",
    "pii_detected",
    "confidence",
}

META_KEYS = {"model", "demo_mode", "called"}

TAMIL = "எங்கள் கிராமத்தில் கடந்த 5 நாட்களாக குடிநீர் விநியோகம் இல்லை. பெண்கள் 3 கி.மீ நடந்து தண்ணீர் எடுக்க வேண்டியுள்ளது."
HINDI = "वाराणसी में मुख्य सड़क पर गहरा गड्ढा है जिससे कई बाइक सवार गिरकर घायल हो चुके हैं। तुरंत मरम्मत की आवश्यकता है।"
ENGLISH = "Primary health centre in block has no doctor for three weeks, pregnant women and children suffering."
HINGLISH = "Hamare mohalle mein transformer blast hone ke baad se light chali gayi hai. 3 din se electricity nahi hai."
PII_TEXT = "My name is Rajesh Sharma, contact 9876543210, Aadhaar 1234 5678 9012. Sewage pipe broken behind government school."


def assert_schema(result: dict) -> None:
    assert SCHEMA_KEYS.issubset(set(result.keys()))
    assert META_KEYS.issubset(set(result.keys()))
    assert 1 <= int(result["urgency"]) <= 5
    assert 0.0 <= float(result["confidence"]) <= 1.0
    assert 0.0 <= float(result["language_confidence"]) <= 1.0
    assert result["sector"] in classifier.SECTORS
    assert result["sentiment"] in classifier.SENTIMENTS
    assert isinstance(result["location_mentions"], list)
    assert isinstance(result["vulnerable_group_flags"], list)
    assert isinstance(result["pii_detected"], bool)


@pytest.fixture(autouse=True)
def demo_credentials(monkeypatch):
    monkeypatch.setattr(gemini.settings, "google_api_key", "")
    monkeypatch.setattr(gemini.settings, "vertex_ai_project", "")


# --------------------------------------------------------------------------
# Schema coverage across languages
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_classify_tamil_input():
    result = await classifier.classify(TAMIL)
    assert_schema(result)
    assert result["original_text"] == TAMIL
    assert result["sector"] == "water"
    assert result["detected_language"] == "ta"
    assert result["demo_mode"] is True


@pytest.mark.asyncio
async def test_classify_hindi_input():
    result = await classifier.classify(HINDI)
    assert_schema(result)
    assert result["original_text"] == HINDI
    assert result["sector"] == "roads"
    assert result["detected_language"] == "hi"


@pytest.mark.asyncio
async def test_classify_english_input():
    result = await classifier.classify(ENGLISH)
    assert_schema(result)
    assert result["original_text"] == ENGLISH
    assert result["sector"] == "health"
    assert result["detected_language"] == "en"
    assert 1 <= len(result["english_summary"].split()) <= 50


@pytest.mark.asyncio
async def test_classify_mixed_hinglish_input():
    result = await classifier.classify(HINGLISH)
    assert_schema(result)
    assert result["original_text"] == HINGLISH
    assert result["sector"] == "electricity"


@pytest.mark.asyncio
async def test_classify_pii_input_is_flagged():
    result = await classifier.classify(PII_TEXT)
    assert_schema(result)
    assert result["pii_detected"] is True
    assert result["original_text"] == PII_TEXT


@pytest.mark.asyncio
async def test_classify_empty_string_does_not_call_model(monkeypatch):
    async def fail(*args, **kwargs):
        raise AssertionError("model must not be called for an empty input")

    monkeypatch.setattr(gemini, "_generate_structured", fail)
    result = await classifier.classify("")
    assert_schema(result)
    assert result["called"] is False
    assert result["original_text"] == ""
    assert result["sector"] == "other"
    assert result["confidence"] == 0.0


@pytest.mark.asyncio
async def test_classify_whitespace_only_is_treated_as_empty():
    result = await classifier.classify("     \n\t  ")
    assert_schema(result)
    assert result["called"] is False


@pytest.mark.asyncio
async def test_classify_input_over_5000_chars_preserves_original():
    long_text = (TAMIL + " ") * 200
    assert len(long_text) > 5000
    result = await classifier.classify(long_text)
    assert_schema(result)
    assert result["original_text"] == long_text
    assert result["input_truncated_for_model"] is True
    assert len(result["original_text"]) == len(long_text)


# --------------------------------------------------------------------------
# Live Gemini path: structured output, normalisation, backoff
# --------------------------------------------------------------------------


@pytest.fixture()
def live(monkeypatch):
    monkeypatch.setattr(gemini.settings, "google_api_key", "test-key")
    return monkeypatch


@pytest.mark.asyncio
async def test_live_classify_uses_structured_json_schema(live):
    captured: dict = {}

    async def fake_generate(prompt, *, schema=None, model=None, system=None):
        captured.update({"schema": schema, "model": model, "prompt": prompt})
        return {
            "detected_language": "ta",
            "language_confidence": 1.4,
            "original_text": "MODEL SHOULD NOT SET THIS",
            "english_summary": "Water shortage in the village.",
            "sector": "water",
            "subcategory": "supply_cut",
            "urgency": 9,
            "sentiment": "angry",
            "location_mentions": ["Dindigul"],
            "vulnerable_group_flags": ["elderly", "ghosts"],
            "pii_detected": False,
            "confidence": 1.7,
        }

    live.setattr(gemini, "_generate_structured", fake_generate)
    result = await classifier.classify(TAMIL)

    assert captured["schema"]["properties"]["sector"]["enum"] == list(classifier.SECTORS)
    assert captured["model"] == gemini.settings.gemini_model
    assert_schema(result)
    assert result["original_text"] == TAMIL, "original_text must be preserved exactly"
    assert result["urgency"] == 5, "urgency must be clamped to 1-5"
    assert result["sentiment"] == "neutral", "unknown sentiment must fall back"
    assert result["sector"] == "water"
    assert result["confidence"] == 1.0
    assert result["language_confidence"] == 1.0
    assert result["vulnerable_group_flags"] == ["elderly"]
    assert result["model"] == gemini.settings.gemini_model
    assert result["demo_mode"] is False
    assert result["called"] is True


def test_generation_config_forces_json_mime_type():
    from app.services.classifier import CLASSIFICATION_SCHEMA

    config = gemini._generation_config(CLASSIFICATION_SCHEMA)
    assert config["response_mime_type"] == "application/json"
    assert config["response_schema"] is CLASSIFICATION_SCHEMA
    assert gemini._generation_config(None) == {}


@pytest.mark.asyncio
async def test_rate_limit_triggers_exponential_backoff(live):
    calls = {"n": 0}

    async def flaky(prompt, *, schema=None, model=None, system=None):
        calls["n"] += 1
        if calls["n"] < 3:
            raise RuntimeError("429 RESOURCE_EXHAUSTED: rate limit exceeded")
        return {"sector": "water", "urgency": 3, "confidence": 0.9}

    async def no_sleep(_delay):
        return None

    live.setattr(gemini, "_generate_structured", flaky)
    live.setattr(gemini, "_backoff", no_sleep)

    result = await classifier.classify("No water supply in our area since morning")
    assert calls["n"] == 3
    assert result["sector"] == "water"
    assert result["demo_mode"] is False


@pytest.mark.asyncio
async def test_live_failure_falls_back_to_labelled_demo_data(live):
    async def always_fail(prompt, *, schema=None, model=None, system=None):
        raise RuntimeError("upstream unavailable")

    live.setattr(gemini, "_generate_structured", always_fail)
    result = await classifier.classify(ENGLISH)
    assert result["demo_mode"] is True
    assert result["model"] == "none"
    assert result["called"] is False
    assert str(result["note"]).startswith("live_call_failed")


# --------------------------------------------------------------------------
# Demo mode reporting
# --------------------------------------------------------------------------


def test_describe_reports_demo_mode_without_credentials():
    meta = classifier.describe()
    assert meta["demo_mode"] is True
    assert meta["model"] == "none"
    assert meta["provider"] == "demo"
    assert meta["note"]


def test_describe_reports_real_model_when_configured(monkeypatch):
    monkeypatch.setattr(gemini.settings, "google_api_key", "test-key")
    meta = classifier.describe()
    assert meta["demo_mode"] is False
    assert meta["model"] == gemini.settings.gemini_model
    assert meta["provider"] == "google"


@pytest.mark.asyncio
async def test_classify_and_rank_demo_returns_precomputed_ranking():
    ranked = await classifier.classify_and_rank([TAMIL, HINDI])
    assert len(ranked) == 5
    assert [item["rank"] for item in ranked] == [1, 2, 3, 4, 5]
    assert all(item["demo_mode"] is True for item in ranked)
    assert all("affected_count" not in item for item in ranked)


@pytest.mark.asyncio
async def test_classify_and_rank_empty_list():
    assert await classifier.classify_and_rank([]) == []


def test_normalize_round_trips_demo_payload():
    raw = json.loads(json.dumps({
        "detected_language": "hi",
        "language_confidence": 0.9,
        "english_summary": "x",
        "sector": "NOT_A_SECTOR",
        "subcategory": "y",
        "urgency": 0,
        "sentiment": "unknown",
        "location_mentions": ["A"],
        "vulnerable_group_flags": ["children"],
        "pii_detected": 1,
        "confidence": -1,
    }))
    result = classifier.normalize(raw, "input")
    assert result["sector"] == "other"
    assert result["urgency"] == 1
    assert result["sentiment"] == "neutral"
    assert result["pii_detected"] is True
    assert result["confidence"] == 0.0
    assert result["original_text"] == "input"
