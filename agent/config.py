"""Environment-based settings for the UrbanMind agent."""

import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/urbanmind",
)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
report_backend_url = os.getenv("report_backend_url", "http://localhost:8000")
