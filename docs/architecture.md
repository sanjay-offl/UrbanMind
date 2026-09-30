# Architecture

## System Overview

UrbanMind is a Next.js frontend and FastAPI backend. The backend owns grievance data and business logic; the frontend and agent are clients of its `/api/v1` HTTP surface. Gemini powers structured classification and text embeddings. Without Google credentials, the API serves labelled, precomputed demo examples.

```
┌──────────────────────────┐         ┌──────────────────────────┐
│        Frontend          │         │          Agent           │
│   Next.js 14 (Vercel)    │         │     Gemini agent          │
│  Tailwind / shadcn/ui    │         │  tools / chat memory      │
│  Recharts / Leaflet      │         └───────────┬──────────────┘
└────────────┬─────────────┘                     │ (HTTP tools)
             │ HTTPS                             │
             │ /api/v1/*                         │
┌────────────▼─────────────┐                     │
│        Backend           │◄────────────────────┘
│     FastAPI (Railway)    │
│  ┌────────┬────────┬────┐│
│  │ingestion│classifier│  ││
│  ├────────┼────────┼────┤│
│  │ scorer │embeddings│   ││
│  └───┬────┴────┬───┴────┘│
└──────┼─────────┼─────────┘
       │         │
┌──────▼─────┐  ┌▼────────────┐
│ PostgreSQL │  │    Redis    │
│ grievances │  │ agent chat  │
│ wards/users│  │ memory      │
│ embeddings │  │             │
└────────────┘  └─────────────┘
```

### Backend services

- **ingestion** — validates uploaded CSVs (Pandas), normalizes columns, deduplicates by title+description hash, bulk-inserts into `grievances` with status `pending`.
- **classifier** — calls Gemini Flash with JSON response schema for language, sector, urgency, sentiment, locations, vulnerability, PII, and confidence. Rate limits use exponential backoff; unavailable service falls back only to labelled precomputed examples.
- **scorer** — computes a 0–100 severity score from category risk weights, sentiment, and recency; maps to `critical | high | medium | low` and sets `priority`.
- **embeddings** — embeds each grievance with Gemini `text-embedding-004`; PostgreSQL stores `ARRAY(FLOAT)` vectors and background cosine similarity groups requests.

## Data Flow: Complaint Lifecycle

```
┌────────┐  ┌────────┐  ┌───────────┐  ┌────────┐  ┌─────────┐  ┌────────────┐
│ Upload │→ │ Ingest │→ │ Classify  │→ │ Score  │→ │  Embed  │→ │  Dashboard │
│  CSV   │  │ Pandas │  │  Gemini   │  │  0-100 │  │Postgres│  │  ranked    │
└────────┘  └────────┘  └───────────┘  └────────┘  └─────────┘  └────────────┘
       POST /       validate      JSON schema    risk +      vectors     frontend
  upload       + dedupe       category      sentiment               reads via
               → pending      → classified  + recency               GET endpoints
```

1. `POST /api/v1/upload` — a CSV lands in ingestion; each row becomes a `pending` grievance.
2. Ingestion passes requests to the classifier; Gemini returns structured classification; status → `classified`.
3. The scorer updates `score` and `priority` from category risk, sentiment, and age.
4. Gemini embeddings are stored in PostgreSQL and used by background cosine-similarity clustering.
5. The frontend dashboard and analytics endpoints read from PostgreSQL; the agent answers questions against the same APIs plus vector search.

## Deployment Topology

```
                            ┌─────────────────┐
              HTTPS         │   Vercel        │  frontend (Next.js)
Browser ──────────────────►│   frontend/     │
                            └────────┬────────┘
                                     │ NEXT_PUBLIC_API_URL
                            ┌────────▼────────┐
                            │   Railway       │  backend + agent
                            │   backend/      │  (FastAPI on :8000)
                            └────────┬────────┘
                       ┌───────────────┼───────────────┐
                ┌─────▼─────┐   ┌─────▼─────┐
                │  Railway  │   │ Upstash   │
                │ Postgres  │   │ Redis     │
                └───────────┘   └───────────┘

Self-hosted alternative: docker compose (infra/) runs nginx → frontend,
backend, PostgreSQL, and Redis on a single host.
```

- **Frontend** → Vercel. Server-side rendering; API calls proxied through Next.js API routes to keep `NEXT_PUBLIC_API_URL` centralized. Deployment triggered by `.github/workflows/deploy.yml`.
- **Backend** → Railway. The FastAPI app (with the agent endpoints) runs in a single service; Postgres and Redis are managed Railway plugins.
- **Docker** → `infra/docker-compose.yml` assembles the same topology locally or on a VPS; nginx terminates TLS and proxies `/api/v1` to the backend.

## Tech Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js 14 App Router | SSR for dashboard performance, built-in API routes as a proxy layer, first-class Vercel deploy |
| FastAPI + Pydantic | Async, typed request/response contracts shared with the frontend via the OpenAPI spec |
| SQLAlchemy + Alembic | ORM for the relational core, versioned migrations for the three-table schema |
| Gemini Flash structured output | Multilingual classification with a constrained JSON schema |
| LangChain agent | Tool-based composition; the agent calls real API endpoints, so no logic is duplicated in the agent |
| Redis | Cheap, fast session-scoped chat memory (`session:{session_id}` lists) |
| Gemini embeddings + PostgreSQL | Google text embeddings with PostgreSQL persistence and cosine clustering |
| Priority model in backend | Scoring is deterministic and testable (pytest) rather than living in UI or agent code |
| ReportLab (backend) | PDF generation stays server-side; the frontend only downloads the artifact |
