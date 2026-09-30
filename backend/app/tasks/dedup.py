"""Recompute duplicate clusters from stored Gemini embeddings.

Requests whose cosine similarity reaches the configured threshold (default
0.92) are grouped into one cluster.  This runs in the background after
ingestion; it never invents numbers — similarity is computed from the stored
vectors only.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import SessionLocal
from app.models import Grievance
from app.services.embeddings import cosine_similarity


def cluster_texts(texts: list[str], vectors: list[list[float]], threshold: float) -> list[int]:
    """Union-Find over pairs with cosine similarity >= threshold.

    Returns one cluster label per input row (labels are dense integers).
    """
    parent = list(range(len(texts)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)

    for i in range(len(vectors)):
        if vectors[i] is None:
            continue
        for j in range(i + 1, len(vectors)):
            if vectors[j] is None:
                continue
            if cosine_similarity(vectors[i], vectors[j]) >= threshold:
                union(i, j)

    labels: dict[int, int] = {}
    result: list[int] = []
    for index in range(len(texts)):
        root = find(index)
        if root not in labels:
            labels[root] = len(labels)
        result.append(labels[root])
    return result


def _cluster_key(grievance_id: int, label: int) -> str:
    return f"clu_{grievance_id}_{label}"


def assign_clusters(db: Session | None = None, threshold: float | None = None) -> int:
    """Assign ``cluster_id`` to every grievance that has an embedding."""
    own_session = db is None
    if own_session:
        db = SessionLocal()
    limit = threshold if threshold is not None else settings.dedup_similarity_threshold
    try:
        rows = list(db.scalars(select(Grievance).where(Grievance.embedding.is_not(None))).all())
        if not rows:
            return 0
        vectors = [list(row.embedding or []) for row in rows]
        labels = cluster_texts([row.title or "" for row in rows], vectors, limit)

        # Stable cluster ids: reuse the id of the lowest grievance in the group.
        by_label: dict[int, int] = {}
        for row, label in zip(rows, labels):
            by_label[label] = min(by_label.get(label, row.id), row.id)

        updated = 0
        for row, label in zip(rows, labels):
            new_id = f"clu_{by_label[label]:06d}"
            if row.cluster_id != new_id:
                row.cluster_id = new_id
                updated += 1
        if updated:
            db.commit()
        return updated
    finally:
        if own_session:
            db.close()


def cluster_sizes(db: Session | None = None) -> dict[str, int]:
    """Number of requests per cluster (computed from the database only)."""
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        rows = db.execute(
            select(Grievance.cluster_id).where(Grievance.cluster_id.is_not(None))
        ).all()
        sizes: dict[str, int] = {}
        for (cluster_id,) in rows:
            sizes[cluster_id] = sizes.get(cluster_id, 0) + 1
        return sizes
    finally:
        if own_session:
            db.close()
