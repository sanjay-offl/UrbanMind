from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.init_db import init_db
from app.routers import agent, analytics, grievances, intake, recommendations, reports, upload, webhooks
from app.services.classifier import describe as classifier_describe
from app.services.demo_data import demo_description
from app.tasks.score_refresh import shutdown_scheduler, start_scheduler

API_PREFIX = "/api/v1"

DEMO_BANNER = (
    "DEMO MODE — GOOGLE_API_KEY / VERTEX_AI_PROJECT are not set. "
    "All classifications shown are pre-computed demo data, not live Gemini results."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    yield
    shutdown_scheduler()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(grievances.router, prefix=API_PREFIX)
    app.include_router(upload.router, prefix=API_PREFIX)
    app.include_router(intake.router, prefix=API_PREFIX)
    app.include_router(intake.router)
    app.include_router(webhooks.router)
    app.include_router(analytics.router, prefix=API_PREFIX)
    app.include_router(recommendations.router, prefix=API_PREFIX)
    app.include_router(agent.router, prefix=API_PREFIX)
    app.include_router(reports.router, prefix=API_PREFIX)

    @app.get("/")
    def root():
        return {"app": "UrbanMind API", "version": "1.0.0"}

    @app.get(f"{API_PREFIX}/system/status")
    def system_status():
        """Reports the real model in use, plus a banner when running in demo mode."""
        meta = classifier_describe()
        return {
            "app": settings.app_name,
            "version": "1.0.0",
            "model": meta["model"],
            "provider": meta["provider"],
            "embedding_model": meta["embedding_model"],
            "demo_mode": meta["demo_mode"],
            "demo_banner": DEMO_BANNER if meta["demo_mode"] else None,
            "demo_data": demo_description() if meta["demo_mode"] else None,
        }

    return app


app = create_app()
