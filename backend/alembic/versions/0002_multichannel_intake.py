"""Add Gemini metadata, deduplication, and multichannel intake fields.

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("grievances", sa.Column("sector", sa.String(50), nullable=True))
    op.add_column("grievances", sa.Column("detected_language", sa.String(16), nullable=True))
    op.add_column("grievances", sa.Column("language_confidence", sa.Float(), nullable=True))
    op.add_column("grievances", sa.Column("english_summary", sa.Text(), nullable=True))
    op.add_column("grievances", sa.Column("urgency", sa.Integer(), nullable=True))
    op.add_column("grievances", sa.Column("classifier_confidence", sa.Float(), nullable=True))
    op.add_column("grievances", sa.Column("classification_model", sa.String(64), nullable=True))
    op.add_column("grievances", sa.Column("pii_detected", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("grievances", sa.Column("pii_redacted", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("grievances", sa.Column("cluster_id", sa.String(40), nullable=True))
    op.add_column(
        "grievances",
        sa.Column("embedding", sa.ARRAY(sa.Float()).with_variant(sa.JSON(), "sqlite"), nullable=True),
    )
    op.add_column("grievances", sa.Column("state", sa.String(100), nullable=True))
    op.add_column("grievances", sa.Column("district", sa.String(100), nullable=True))
    op.add_column("grievances", sa.Column("block", sa.String(100), nullable=True))
    op.add_column("grievances", sa.Column("photo_url", sa.String(2048), nullable=True))
    op.alter_column("grievances", "ward_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("grievances", "lat", existing_type=sa.Float(), nullable=True)
    op.alter_column("grievances", "lng", existing_type=sa.Float(), nullable=True)
    op.create_index("ix_grievances_sector", "grievances", ["sector"])
    op.create_index("ix_grievances_cluster_id", "grievances", ["cluster_id"])


def downgrade() -> None:
    op.drop_index("ix_grievances_cluster_id", table_name="grievances")
    op.drop_index("ix_grievances_sector", table_name="grievances")
    op.drop_column("grievances", "photo_url")
    op.drop_column("grievances", "block")
    op.drop_column("grievances", "district")
    op.drop_column("grievances", "state")
    op.drop_column("grievances", "embedding")
    op.drop_column("grievances", "cluster_id")
    op.drop_column("grievances", "pii_redacted")
    op.drop_column("grievances", "pii_detected")
    op.drop_column("grievances", "classification_model")
    op.drop_column("grievances", "classifier_confidence")
    op.drop_column("grievances", "urgency")
    op.drop_column("grievances", "english_summary")
    op.drop_column("grievances", "language_confidence")
    op.drop_column("grievances", "detected_language")
    op.drop_column("grievances", "sector")