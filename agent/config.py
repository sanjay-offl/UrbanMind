"""Environment-based settings for the UrbanMind agent."""

import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/urbanmind",
)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
VERTEX_AI_PROJECT = os.getenv("VERTEX_AI_PROJECT", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
report_backend_url = os.getenv("report_backend_url", "http://localhost:8000")
