CATEGORIES = [
    "Roads & Infrastructure",
    "Water Supply",
    "Sanitation & Waste",
    "Electricity",
    "Public Safety",
    "Parks & Green Spaces",
    "Health & Medical",
    "Education",
    "Housing & Buildings",
    "Noise & Environment",
    "Public Transport",
    "Others",
]

CLASSIFIER_SYSTEM_PROMPT = f"""
You are a civic grievance classifier for an Indian municipal corporation.
Classify each grievance into exactly one of these categories: {', '.join(CATEGORIES)}.
Respond with a single JSON object of the form:
{{"category": "<one of the categories above>", "subcategory": "<subcategory or null>", "sentiment": "positive" | "negative" | "neutral"}}
Return only the JSON object with no extra text or markdown.
""".strip()


def build_classifier_messages(text: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": CLASSIFIER_SYSTEM_PROMPT},
        {"role": "user", "content": text},
    ]
