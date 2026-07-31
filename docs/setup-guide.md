# Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | required by frontend builds |
| npm | 10+ | ships with Node 20 |
| Python | 3.11 | backend + agent |
| Docker | 24+ | optional; full-stack local run |
| Docker Compose | v2 | optional; full-stack local run |
| PostgreSQL | 15+ | local, or via Docker/Railway |
| Redis | 7+ | local, or via Docker/Upstash |

## 1. Backend Setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set at minimum `DATABASE_URL`, `ANTHROPIC_API_KEY`, `REDIS_URL`, and `PINECONE_API_KEY` (see root [`.env.example`](../.env.example)).

Apply migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/v1/analytics/summary`

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`, then:

```bash
npm run dev
```

Open http://localhost:3000.

## 3. Agent Setup

The agent runs inside the backend process (exposes `/api/v1/agent/chat`). It requires `ANTHROPIC_API_KEY` and `REDIS_URL` from the backend `.env`. If you run the agent standalone:

```bash
cd agent
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.agent    # local REPL / server, depends on running backend
```

## 4. Full Stack via Docker Compose

```bash
docker compose -f infra/docker-compose.yml up --build
```

Brings up PostgreSQL, Redis, backend, frontend, and nginx. Frontend: http://localhost:3000, API: http://localhost:8000 (proxied through nginx on :80).

## 5. Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/          # or: pytest tests/ -q
```

The backend suite covers ingestion validation, classification fallback, scoring, and API endpoints (uses a throwaway test database — see `tests/conftest.py`). CI runs the same command in `.github/workflows/test.yml`.

## 6. Migrations Workflow

Alembic lives in `backend/` (`alembic.ini`, `alembic/`).

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "add column to grievances"   # after model edits
alembic upgrade head                                             # apply
alembic downgrade -1                                             # rollback
```

Rules:

- Run autogenerate against your local DB and **review the generated diff** before committing.
- Never hand-edit an already-applied migration.
- CI/CD runs `alembic upgrade head` as part of the Railway deploy.

## 7. Deploying

### Frontend → Vercel

```bash
npm i -g vercel
cd frontend
vercel link --project <your-project-id>
vercel --prod
```

Or push to `main` — `.github/workflows/deploy.yml` builds and deploys via `vercel/actions/deploy@v1` with secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL in the Vercel project env settings.

### Backend → Railway

```bash
railway up
```

From `backend/` after linking the project. `RAILWAY_TOKEN` is required in non-interactive environments (CI). The deploy runs `alembic upgrade head` before starting the app (see `railway.json` / Dockerfile). Alternatively, wire the deploy hook URL into the `RAILWAY_DEPLOY_HOOK` env var and curl it from CI.

## 8. CI/CD Notes

- **Test** (`.github/workflows/test.yml`): runs on every pull request — frontend lint + build, backend pytest.
- **Deploy** (`.github/workflows/deploy.yml`): runs on push to `main` — Vercel for the frontend, Railway for the backend.
- Required repository secrets: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`.
- The `.env.example` in the repo is a template only; real secrets live in the hosting platform's secret store.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` in the active venv |
| Alembic can't connect | Verify `DATABASE_URL` in `backend/.env`; confirm Postgres is running |
| Frontend API 404s | Check `NEXT_PUBLIC_API_URL` in `.env.local`; backend on :8000? |
| Upload rows rejected | CSV needs `title`, `description`, `ward_name`/`ward_id`, `lat`, `lng` columns |
| Agent chat empty replies | Check `ANTHROPIC_API_KEY` and that Redis is reachable |
