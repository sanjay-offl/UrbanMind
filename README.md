# UrbanMind

From citizen voice to national priorities. UrbanMind turns civic requests into an explainable demand intelligence layer for public decision-making.

UrbanMind ingests citizen complaints via CSV upload, classifies them with Gemini Flash structured output, scores priority, and surfaces a ranked, filterable dashboard with geographic mapping, trend analytics, and exportable PDF reports. Without Google credentials it starts in demo mode and serves only labelled precomputed examples.

## Features

- **CSV Upload** — batch-upload citizen complaints with automatic schema validation and deduplication
- **AI Classification** — Gemini Flash returns language, sector, urgency, sentiment, place mentions, vulnerability flags, PII detection, and confidence
- **Priority Scoring** — 0–100 severity score combining category risk, sentiment, and recency; rolled into `critical | high | medium | low` tiers
- **Ranked Dashboard** — sortable, filterable grievance queue ordered by priority
- **Interactive Map** — Leaflet-powered ward-level heatmap and pin clustering from lat/lng coordinates
- **Trends & Analytics** — category breakdowns, ward comparisons, and time-series trend charts (Recharts)
- **Agent Chat** — Gemini agent integration with Redis conversation memory
- **PDF Reports** — generate, list, and download branded PDF reports (ReportLab)

## Monorepo Layout

```
UrbanMind/
├── frontend/        # Next.js 14 app (Tailwind, shadcn/ui, Recharts, Leaflet)
├── backend/         # FastAPI service (SQLAlchemy, Pandas, Alembic, ReportLab)
├── agent/           # Gemini agent integration, tools, Redis memory
├── infra/           # docker-compose, Dockerfiles, nginx configs
├── docs/            # architecture, API reference, data model, setup guide
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Leaflet |
| Backend   | FastAPI, SQLAlchemy, Pandas, Alembic, ReportLab, Pydantic |
| AI        | Gemini Flash structured classification, Gemini text-embedding-004 |
| Database  | PostgreSQL (grievances, wards, users) |
| Cache/State | Redis (agent chat memory) |
| Vectors   | PostgreSQL `ARRAY(FLOAT)` embeddings; cosine similarity clustering |
| Deploy    | Vercel (frontend), Railway (backend), Docker (self-hosted) |

## Quickstart

### Backend (local)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Google credentials are optional; without them the API uses labelled demo data.
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend (local)

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Full stack (Docker)

```bash
docker compose -f infra/docker-compose.yml up
```

This boots PostgreSQL, Redis, the FastAPI backend, the frontend, and nginx together.

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string for agent memory
- `GOOGLE_API_KEY` — Gemini API access
- `VERTEX_AI_PROJECT`, `VERTEX_AI_LOCATION` — Vertex AI project and region
- `GOOGLE_APPLICATION_CREDENTIALS` — credentials for Google Cloud APIs
- `FIREBASE_PROJECT_ID` — Firebase project identifier
- `NEXT_PUBLIC_API_URL` — backend base URL for the frontend
- `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN` — deploy tokens

## Documentation

- [Architecture](docs/architecture.md) — system design, data flow, deployment topology
- [API Reference](docs/api-reference.md) — endpoint specs and examples
- [Data Model](docs/data-model.md) — PostgreSQL schema, Redis keys, and stored embeddings
- [Setup Guide](docs/setup-guide.md) — local dev, migrations, tests, deployment

  ## Live deployment

  See the platform in action at the live demo: https://urban-mind-mauve.vercel.app

  ## License

  MIT — see [LICENSE](LICENSE).
