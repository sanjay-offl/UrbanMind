# Architecture

## System Overview

UrbanMind is a three-tier monorepo: a Next.js frontend, a FastAPI backend that owns all data access and business logic, and a LangChain agent that sits on top of the backend's tool layer. The backend is the single source of truth for grievance data; the frontend and agent are stateless clients of its `/api/v1` HTTP surface.

```
┌──────────────────────────┐         ┌──────────────────────────┐
│        Frontend          │         │          Agent           │
│   Next.js 14 (Vercel)    │         │  LangChain + Claude       │
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
┌──────▼─────┐  ┌▼────────────┐   ┌─────────────┐
│ PostgreSQL │  │    Redis    │   │  Pinecone   │
│ grievances │  │ agent chat  │   │ index:      │
│ wards/users│  │ memory      │   │ urbanmind   │
└────────────┘  └─────────────┘   │ (1536-d)    │
                                  └─────────────┘
```

### Backend services

- **ingestion** — validates uploaded CSVs (Pandas), normalizes columns, deduplicates by title+description hash, bulk-inserts into `grievances` with status `pending`.
- **classifier** — calls Claude Sonnet 4.6 to assign `category`/`subcategory` with confidence; updates rows to `classified`. Failed calls retry with exponential backoff, then fall back to a rule-based classifier.
- **scorer** — computes a 0–100 severity score from category risk weights, sentiment, and recency; maps to `critical | high | medium | low` and sets `priority`.
- **embeddings** — embeds each grievance with OpenAI `text-embedding-3-small` (1536-d) and upserts vectors into Pinecone (`urbanmind` index) for similarity search used by the agent.

## Data Flow: Complaint Lifecycle

```
┌────────┐  ┌────────┐  ┌───────────┐  ┌────────┐  ┌─────────┐  ┌────────────┐
│ Upload │→ │ Ingest │→ │ Classify  │→ │ Score  │→ │  Embed  │→ │  Dashboard │
│  CSV   │  │ Pandas │  │  Claude   │  │  0-100 │  │Pinecone│  │  ranked    │
└────────┘  └────────┘  └───────────┘  └────────┘  └─────────┘  └────────────┘
  POST /       validate      Sonnet 4.6     risk +      1536-d      frontend
  upload       + dedupe       category      sentiment               reads via
               → pending      → classified  + recency               GET endpoints
```

1. `POST /api/v1/upload` — a CSV lands in ingestion; each row becomes a `pending` grievance.
2. Ingestion passes batches to the classifier; Claude returns category/subcategory; status → `classified`.
3. The scorer updates `score` and `priority` from category risk, sentiment, and age.
4. Embeddings upsert vectors to Pinecone in the same pipeline.
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
                    ┌───────────────┼────────────────┐
              ┌─────▼─────┐   ┌─────▼─────┐   ┌──────▼─────┐
              │  Railway  │   │ Upstash   │   │  Pinecone  │
              │ Postgres  │   │ Redis     │   │  urbanmind │
              └───────────┘   └───────────┘   └────────────┘

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
| Claude Sonnet 4.6 | Strong structured-output reliability for category/subcategory classification |
| LangChain agent | Tool-based composition; the agent calls real API endpoints, so no logic is duplicated in the agent |
| Redis | Cheap, fast session-scoped chat memory (`session:{session_id}` lists) |
| Pinecone + OpenAI embeddings | Managed vector DB with 1536-d vectors; no infra to operate |
| Priority model in backend | Scoring is deterministic and testable (pytest) rather than living in UI or agent code |
| ReportLab (backend) | PDF generation stays server-side; the frontend only downloads the artifact |
