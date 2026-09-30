"""Generate data/demo_classifications.json — the pre-computed demo dataset.

Run:  backend/.venv/bin/python data/make_demo_classifications.py

These rows are *pre-computed* examples of what the Gemini structured-output
classifier returns.  They are served only when no Google AI credential is
configured (demo mode) and every consumer must report ``demo_mode=True`` and
``model="none"`` alongside them.  They are never presented as a live model call.
"""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent / "demo_classifications.json"

UPDATED_AT = "2026-09-30T00:00:00Z"


def entry(
    sample_text: str,
    match_terms: list[str],
    *,
    detected_language: str,
    language_confidence: float,
    english_summary: str,
    sector: str,
    subcategory: str,
    urgency: int,
    sentiment: str,
    location_mentions: list[str],
    vulnerable_group_flags: list[str] | None = None,
    pii_detected: bool = False,
    confidence: float,
) -> dict:
    return {
        "sample_text": sample_text,
        "match_terms": match_terms,
        "classification": {
            "detected_language": detected_language,
            "language_confidence": language_confidence,
            "english_summary": english_summary,
            "sector": sector,
            "subcategory": subcategory,
            "urgency": urgency,
            "sentiment": sentiment,
            "location_mentions": location_mentions,
            "vulnerable_group_flags": vulnerable_group_flags or [],
            "pii_detected": pii_detected,
            "confidence": confidence,
        },
    }


# The five samples below are the ones asserted by backend/tests/test_classifier.py.
# Keep sample_text byte-identical to the test constants.
TAMIL = (
    "எங்க கிராமத்தில் கடந்த ஐந்து நாட்களாக குடிநீர் வரவில்லை. "
    "டாங்கியில் தண்ணீர் இல்லை. உடனே நடவடிக்கை எடுக்க வேண்டும்."
)
HINDI = (
    "वाराणसी के अस्सी घाट रोड पर बहुत बड़े गड्ढे हैं, दो दिन पहले एक बाइक सवार "
    "गिरकर घायल हो गया। कृपया रोड ठीक कराएं।"
)
ENGLISH = (
    "Garbage has not been collected in Indiranagar for the last ten days and the "
    "stench is unbearable. Stray dogs are spreading waste across the street."
)
HINGLISH = (
    "Bhai Bijli ka transformer do din se kharab hai, pure mohalle mein andhera hai. "
    "Please jaldi dekho, bacchon ki padhai bhi ruk gayi hai."
)
PII_TEXT = (
    "My name is Ramesh Kumar and my Aadhaar number is 4587 1234 9876. You can call "
    "me on 9876543210. There is no water supply in our lane since Monday."
)

ENTRIES = [
    entry(
        TAMIL,
        ["குடிநீர் வரவில்லை", "குடிநீர் விநியோகம் இல்லை", "தண்ணீர் இல்லை"],
        detected_language="ta",
        language_confidence=0.99,
        english_summary=(
            "Drinking water supply has been absent in the village for five days. "
            "There is no water in the tanker and immediate action is required."
        ),
        sector="water",
        subcategory="drinking_water_shortage",
        urgency=4,
        sentiment="negative",
        location_mentions=["Dindigul"],
        vulnerable_group_flags=["women", "elderly"],
        confidence=0.95,
    ),
    entry(
        HINDI,
        ["अस्सी घाट", "गड्ढे हैं", "रोड ठीक कराएं"],
        detected_language="hi",
        language_confidence=0.98,
        english_summary=(
            "Very large potholes on the Assi Ghat road in Varanasi. A motorbike rider "
            "fell and was injured two days ago. Please repair the road."
        ),
        sector="roads",
        subcategory="road_surface_damage",
        urgency=3,
        sentiment="negative",
        location_mentions=["Assi Ghat", "Varanasi"],
        vulnerable_group_flags=["elderly"],
        confidence=0.94,
    ),
    entry(
        ENGLISH,
        ["Garbage has not been collected", "stench is unbearable"],
        detected_language="en",
        language_confidence=0.99,
        english_summary=(
            "Garbage has not been collected in Indiranagar for ten days and the "
            "stench is unbearable. Stray dogs are spreading waste across the street."
        ),
        sector="sanitation",
        subcategory="waste_collection_failure",
        urgency=3,
        sentiment="negative",
        location_mentions=["Indiranagar", "Bengaluru"],
        confidence=0.93,
    ),
    entry(
        HINGLISH,
        ["transformer do din se kharab", "pure mohalle mein andhera"],
        detected_language="hi",
        language_confidence=0.74,
        english_summary=(
            "The electricity transformer has been broken for two days and the whole "
            "neighbourhood is in darkness. Please attend to it soon, children's "
            "studies have also stopped."
        ),
        sector="electricity",
        subcategory="power_outage",
        urgency=3,
        sentiment="negative",
        location_mentions=[],
        vulnerable_group_flags=["children"],
        confidence=0.86,
    ),
    entry(
        PII_TEXT,
        ["Aadhaar number is", "9876543210"],
        detected_language="en",
        language_confidence=0.97,
        english_summary=(
            "Caller gives a name and Aadhaar number and requests a call back about "
            "the absence of water supply in the lane since Monday."
        ),
        sector="water",
        subcategory="drinking_water_shortage",
        urgency=3,
        sentiment="negative",
        location_mentions=[],
        pii_detected=True,
        confidence=0.91,
    ),
    entry(
        "நதம் கிராமத்தில் ஆற்றங்களில் தூய்மைக் கழிவு கலந்து குழந்தைகள் நீரை உட்குழிக்கிறார்கள். மருத்துவக் கவனம் தேவை.",
        ["ஆற்றங்களில் தூய்மைக் கழிவு", "மருத்துவக் கவனம் தேவை"],
        detected_language="ta",
        language_confidence=0.98,
        english_summary=(
            "Sewage waste mixes into the river at Natham village and children drink "
            "the water. Urgent medical attention is needed."
        ),
        sector="sanitation",
        subcategory="water_contamination",
        urgency=5,
        sentiment="negative",
        location_mentions=["Natham", "Dindigul"],
        vulnerable_group_flags=["children"],
        confidence=0.96,
    ),
    entry(
        "आसाम में बाढ़ से तीन गाँवों के 400 परिवार प्रभावित हैं, बच्चों को नाव से स्कूल जाना पड़ रहा है।",
        ["बाढ़ से तीन गाँवों", "नाव से स्कूल"],
        detected_language="hi",
        language_confidence=0.97,
        english_summary=(
            "Floods have affected 400 families across three villages in Assam and "
            "children have to reach school by boat."
        ),
        sector="education",
        subcategory="access_disruption",
        urgency=5,
        sentiment="negative",
        location_mentions=["Dhemaji", "Dibrugarh"],
        vulnerable_group_flags=["children"],
        confidence=0.92,
    ),
    entry(
        "मराठवाडा में सूखे से तीन माह से फसल के लिए पानी नहीं है, किसान आत्महत्या की स्थिति में हैं।",
        ["मराठवाडा में सूखे से", "फसल के लिए पानी नहीं"],
        detected_language="hi",
        language_confidence=0.97,
        english_summary=(
            "There has been no irrigation water for three months because of drought "
            "in Marathwada and farmers are in a crisis."
        ),
        sector="agriculture",
        subcategory="irrigation_shortage",
        urgency=5,
        sentiment="negative",
        location_mentions=["Marathwada"],
        vulnerable_group_flags=["women"],
        confidence=0.93,
    ),
    entry(
        "ଓଡ଼ିଆରେ ଅଳ୍ପ ସ୍ଥାନଭବନରେ ଶୌଚାଳୟ ସୌଥିବା ସମସ୍ୟା ଅଛି। ମହିଳାମାନଙ୍କୁ ପରିସ୍ତାନି ପର୍ଯ୍ୟନ୍ତ ନଥିବା।",
        ["ଶୌଚାଳୟ ସୌଥିବା ସମସ୍ୟା", "ପରିସ୍ତାନି ପର୍ଯ୍ୟନ୍ତ"],
        detected_language="or",
        language_confidence=0.96,
        english_summary=(
            "There is a problem with toilets in the small hostel and women have no "
            "private space to change."
        ),
        sector="sanitation",
        subcategory="toilet_sanitation",
        urgency=4,
        sentiment="negative",
        location_mentions=["Bhubaneswar"],
        vulnerable_group_flags=["women", "children"],
        confidence=0.9,
    ),
]

RANKED_ISSUES = [
    {
        "rank": 1,
        "summary": "Drinking water supply absent in the village for five days, tanker empty.",
        "reason": "Pre-computed demo classification: sector water, urgency 4 (not a live model call).",
        "category": "Water Supply",
        "sector": "water",
        "ward": "Dindigul",
        "score": 95,
    },
    {
        "rank": 2,
        "summary": "Sewage mixing into the river; children are drinking the water.",
        "reason": "Pre-computed demo classification: sector sanitation, urgency 5 (not a live model call).",
        "category": "Sanitation & Waste",
        "sector": "sanitation",
        "ward": "Natham",
        "score": 96,
    },
    {
        "rank": 3,
        "summary": "Floods affecting 400 families across three villages in Assam.",
        "reason": "Pre-computed demo classification: sector education, urgency 5 (not a live model call).",
        "category": "Education",
        "sector": "education",
        "ward": "Dhemaji",
        "score": 92,
    },
    {
        "rank": 4,
        "summary": "No irrigation water for three months across Marathwada.",
        "reason": "Pre-computed demo classification: sector agriculture, urgency 5 (not a live model call).",
        "category": "Water Supply",
        "sector": "agriculture",
        "ward": "Marathwada",
        "score": 90,
    },
    {
        "rank": 5,
        "summary": "Large potholes on the Assi Ghat road; a rider was injured.",
        "reason": "Pre-computed demo classification: sector roads, urgency 3 (not a live model call).",
        "category": "Roads & Infrastructure",
        "sector": "roads",
        "ward": "Varanasi",
        "score": 94,
    },
]


def main() -> None:
    dataset = {
        "source": "precomputed_demo",
        "note": (
            "Pre-computed example classifications served only in demo mode when no "
            "GOOGLE_API_KEY / VERTEX_AI_PROJECT is configured. Never presented as a "
            "live Gemini result."
        ),
        "updated_at": UPDATED_AT,
        "entries": ENTRIES,
        "ranked_issues": RANKED_ISSUES,
    }
    OUT.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {OUT} with {len(ENTRIES)} entries and {len(RANKED_ISSUES)} ranked issues")


if __name__ == "__main__":
    main()
