# Data Model

## PostgreSQL

Database managed by SQLAlchemy + Alembic. The current models use integer primary keys. PostgreSQL stores Gemini embeddings for background duplicate clustering.

### `grievances`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | NOT NULL |
| `category` | VARCHAR(50) | NULL (set by classifier) |
| `subcategory` | VARCHAR(100) | NULL (set by classifier) |
| `ward_id` | INTEGER | NOT NULL, FK → `wards.id` |
| `ward_name` | VARCHAR(100) | NOT NULL, denormalized from ward lookup |
| `lat` | NUMERIC(9,6) | NULL |
| `lng` | NUMERIC(9,6) | NULL |
| `status` | grievance_status | NOT NULL, default `'pending'` |
| `priority` | grievance_priority | NULL (set by scorer) |
| `score` | SMALLINT | NOT NULL, default 0, CHECK `score BETWEEN 0 AND 100` |
| `sentiment` | VARCHAR(20) | NULL (`positive`, `neutral`, `negative`) |
| `source` | VARCHAR(50) | NOT NULL, default `'csv-upload'` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()`, auto-updated on change |
| `sector`, `detected_language` | VARCHAR | Nullable classifier outputs |
| `language_confidence`, `classifier_confidence` | FLOAT | Nullable classifier confidence values |
| `english_summary` | TEXT | Nullable, maximum 50-word model summary |
| `urgency` | INTEGER | Nullable, classifier value from 1 to 5 |
| `classification_model` | VARCHAR(64) | Actual model name, or `none` for precomputed demo data |
| `pii_detected`, `pii_redacted` | BOOLEAN | PII detection and redaction status |
| `cluster_id` | VARCHAR(40) | Nullable background deduplication cluster identifier |
| `embedding` | `ARRAY(FLOAT)` | Nullable Gemini `text-embedding-004` vector |

### `wards`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE |
| `boundary_geojson` | JSONB | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PK |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE |
| `name` | VARCHAR(120) | NULL |
| `role` | VARCHAR(30) | NOT NULL, default `'official'` (`admin`, `official`, `viewer`) |
| `hashed_password` | VARCHAR(255) | NULL when using SSO |
| `is_active` | BOOLEAN | NOT NULL, default `true` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

## Relationships

```
users 1 ──── n sessions (auth)          grievances n ──── 1 wards
                                         (grievances.ward_id → wards.id)
```

- `grievances.ward_id` → `wards.id` (`ON DELETE RESTRICT` — do not delete wards with grievances).
- Grievance → user assignments and user → report ownership are supported through the same `users` table via nullable `assigned_to`/`created_by` FKs (added as features land).

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `grievances` | `ix_grievances_status` | filter by status |
| `grievances` | `ix_grievances_priority` | filter/sort by priority |
| `grievances` | `ix_grievances_score` | ranked dashboard sort |
| `grievances` | `ix_grievances_ward_id` | ward analytics joins |
| `grievances` | `ix_grievances_category` | category analytics |
| `grievances` | `ix_grievances_created_at` | trend queries |
| `grievances` | `uq_grievances_title_desc_hash` | dedupe on ingest (SHA-256 of normalized title+description) |
| `wards` | `uq_wards_name`, `uq_wards_code` | lookups and joins |
| `users` | `uq_users_email` | unique login |

## Enums

### `grievance_status` (`status`)

`pending` → `classified` → `in_progress` → `resolved` | `closed`

### `grievance_priority` (`priority`)

`critical`, `high`, `medium`, `low` (derived from `score`; stored so dashboard filters are indexed)

### `category`

`Infrastructure`, `Sanitation`, `Water Supply`, `Roads & Transport`, `Public Safety`, `Health & Environment`, `Education`, `Other` — subcategories are free-form strings assigned by the classifier per category.

## Redis

Used for agent chat memory only. Key format: `session:{session_id}` — a Redis List of message dicts (JSON), append-only per turn.

| Key | Type | TTL | Contents |
|-----|------|-----|----------|
| `session:{session_id}` | LIST | 24 h | `{"role": "user"\|"assistant", "content": "...", "ts": "ISO-8601"}` |
| `session:{session_id}:meta` | HASH | 24 h | `{created_at, last_active, model}` |

Sliding TTL refresh on every interaction. A background job purges expired sessions.

## Embeddings and clusters

Gemini `text-embedding-004` vectors are stored directly in PostgreSQL as `ARRAY(FLOAT)`. A background task computes cosine similarity and groups requests at or above the configured `0.92` threshold. Unavailable embeddings are omitted; they are never fabricated.
