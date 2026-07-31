# API Reference

Base URL: `https://api.yourdomain.com/api/v1` (local: `http://localhost:8000/api/v1`)

All routes are under the `/api/v1` prefix. Requests and responses are JSON unless noted. Errors use a consistent format:

```json
{ "detail": "Grievance not found" }
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/grievances` | List grievances with filtering, sorting, and pagination |
| GET | `/grievances/{id}` | Fetch a single grievance |
| POST | `/upload` | Upload a CSV of complaints (multipart/form-data) |
| GET | `/analytics/summary` | Overall stats: totals, status/priority distribution |
| GET | `/analytics/trends` | Time-series of complaints by day/week |
| GET | `/analytics/categories` | Breakdown by category and subcategory |
| GET | `/analytics/wards` | Breakdown by ward |
| POST | `/agent/chat` | Chat with the grievance assistant (session-based) |
| POST | `/reports/generate` | Generate a PDF report from a query/filters |
| GET | `/reports` | List generated reports |
| GET | `/reports/{report_id}/download` | Download a generated PDF |

## GET /grievances

Query params: `status`, `priority`, `category`, `ward_id`, `search`, `sort` (`score|created_at`, default `-score`), `page` (default 1), `page_size` (default 50, max 200).

Request:

```
GET /api/v1/grievances?status=classified&priority=high&sort=-score&page=1&page_size=2
```

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "9f1c2a10-2b3e-4c5d-8e6f-7a8b9c0d1e2f",
      "title": "Broken streetlight on MG Road",
      "description": "Streetlight has been out for two weeks, dark stretch near the market.",
      "category": "Infrastructure",
      "subcategory": "Street Lighting",
      "ward_id": 12,
      "ward_name": "MG Road",
      "lat": 12.9716,
      "lng": 77.5946,
      "status": "classified",
      "priority": "high",
      "score": 82,
      "sentiment": "negative",
      "source": "csv-upload",
      "created_at": "2026-07-30T09:15:00Z",
      "updated_at": "2026-07-30T09:16:42Z"
    }
  ],
  "total": 184,
  "page": 1,
  "page_size": 2
}
```

## POST /upload

Multipart form: `file` (CSV), `ward_name` (optional override column name). Required CSV columns: `title`, `description`, `ward_name` (or `ward_id`), `lat`, `lng`.

Request:

```
POST /api/v1/upload
Content-Type: multipart/form-data
file: <complaints.csv>
```

Response `200 OK`:

```json
{
  "upload_id": "b7d4e5f6-1a2b-3c4d-9e8f-0a1b2c3d4e5f",
  "total_rows": 250,
  "imported": 241,
  "duplicates_skipped": 9,
  "invalid_skipped": 0,
  "status": "processing"
}
```

## GET /analytics/summary

Response `200 OK`:

```json
{
  "total_grievances": 1240,
  "by_status": {
    "pending": 12,
    "classified": 340,
    "in_progress": 410,
    "resolved": 425,
    "closed": 53
  },
  "by_priority": {
    "critical": 38,
    "high": 210,
    "medium": 512,
    "low": 480
  },
  "avg_score": 51.3,
  "sentiment_split": { "positive": 96, "neutral": 612, "negative": 532 },
  "last_updated": "2026-07-30T10:00:00Z"
}
```

## POST /agent/chat

Body: `session_id` (optional, server generates if absent), `message`.

Request:

```json
{
  "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "Which wards have the most critical complaints this month?"
}
```

Response `200 OK`:

```json
{
  "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "reply": "This month, 14 critical complaints were logged across 9 wards. Ward 12 (MG Road) leads with 5 critical complaints.",
  "tool_calls": [
    { "tool": "query_grievances", "args": { "priority": "critical", "since": "2026-07-01" } }
  ],
  "created_at": "2026-07-30T11:20:00Z"
}
```

## POST /reports/generate

Body: `title`, `filters` (same params as `/grievances`, optional), `format` (`pdf`, default).

Request:

```json
{
  "title": "July Ward Report",
  "filters": { "ward_id": 12, "status": "in_progress" },
  "format": "pdf"
}
```

Response `200 OK`:

```json
{
  "report_id": "c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f30",
  "title": "July Ward Report",
  "status": "ready",
  "created_at": "2026-07-30T12:00:00Z",
  "download_url": "/api/v1/reports/c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f30/download"
}
```

## GET /reports

Response `200 OK`:

```json
{
  "items": [
    {
      "report_id": "c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f30",
      "title": "July Ward Report",
      "status": "ready",
      "created_at": "2026-07-30T12:00:00Z"
    }
  ],
  "total": 3
}
```

## GET /reports/{report_id}/download

Returns `200 OK` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<title>.pdf"`. Returns `404 { "detail": "Report not found" }` for unknown IDs.

## Errors

All error responses share the shape:

```json
{ "detail": "string" }
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | Invalid CSV, missing columns, malformed request body |
| 404 | Resource not found |
| 409 | Duplicate upload / conflicting state |
| 422 | Validation error (Pydantic) |
| 429 | Rate limited (classifier/agent backpressure) |
| 500 | Internal error (details logged server-side) |
