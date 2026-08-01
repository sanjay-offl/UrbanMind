# UrbanMind

AI-powered civic intelligence platform that transforms citizen grievances and public data into actionable municipal priorities for smarter governance.

UrbanMind ingests citizen complaints via CSV upload, classifies them with Claude Sonnet 4.6, scores priority using a risk-weighted model, and surfaces a ranked, filterable dashboard to city officials — complete with geographic mapping, trend analytics, an agentic chat assistant, and exportable PDF reports.

## Features

- **CSV Upload** — batch-upload citizen complaints with automatic schema validation and deduplication
- **AI Classification** — Claude Sonnet 4.6 categorizes each grievance into 8 categories and 30+ subcategories with confidence scores
- **Priority Scoring** — 0–100 severity score combining category risk, sentiment, and recency; rolled into `critical | high | medium | low` tiers
- **Ranked Dashboard** — sortable, filterable grievance queue ordered by priority
- **Interactive Map** — Leaflet-powered ward-level heatmap and pin clustering from lat/lng coordinates
- **Trends & Analytics** — category breakdowns, ward comparisons, and time-series trend charts (Recharts)
- **Agent Chat** — LangChain agent with conversational memory (Redis) that can query grievance data, analytics, and reports
- **PDF Reports** — generate, list, and download branded PDF reports (ReportLab)

## Monorepo Layout

```
UrbanMind/
├── frontend/        # Next.js 14 app (Tailwind, shadcn/ui, Recharts, Leaflet)
├── backend/         # FastAPI service (SQLAlchemy, Pandas, Alembic, ReportLab)
├── agent/           # LangChain + Claude agent, tools, Redis memory
├── infra/           # docker-compose, Dockerfiles, nginx configs
├── docs/            # architecture, API reference, data model, setup guide
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Leaflet |
| Backend   | FastAPI, SQLAlchemy, Pandas, Alembic, ReportLab, Pydantic |
| Agent     | LangChain, Claude Sonnet 4.6, tool-calling |
| Database  | PostgreSQL (grievances, wards, users) |
| Cache/State | Redis (agent chat memory) |
| Vectors   | Pinecone (OpenAI `text-embedding-3-small`, 1536-d) |
| Deploy    | Vercel (frontend), Railway (backend), Docker (self-hosted) |

## Quickstart

### Backend (local)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, ANTHROPIC_API_KEY, etc.
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
- `ANTHROPIC_API_KEY` — Claude API key (classification + agent)
- `OPENAI_API_KEY` — embeddings (`text-embedding-3-small`)
- `PINECONE_API_KEY` — vector index (index `urbanmind`, 1536-d)
- `NEXT_PUBLIC_API_URL` — backend base URL for the frontend
- `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN` — deploy tokens

## Documentation

- [Architecture](docs/architecture.md) — system design, data flow, deployment topology
- [API Reference](docs/api-reference.md) — endpoint specs and examples
- [Data Model](docs/data-model.md) — PostgreSQL schema, Redis keys, Pinecone index
- [Setup Guide](docs/setup-guide.md) — local dev, migrations, tests, deployment

  ## Live deployment

  See the platform in action at the live demo: https://urban-mind-mauve.vercel.app

  ## License

  MIT — see [LICENSE](LICENSE).
