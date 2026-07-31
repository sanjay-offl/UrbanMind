"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-31

"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="official"),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "wards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("population", sa.Integer(), nullable=True),
    )
    op.create_table(
        "grievances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("subcategory", sa.String(length=100), nullable=True),
        sa.Column("ward_id", sa.Integer(), sa.ForeignKey("wards.id"), nullable=False),
        sa.Column("ward_name", sa.String(length=100), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="low"),
        sa.Column("score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("sentiment", sa.String(length=20), nullable=False, server_default="neutral"),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="csv"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_grievances_category", "grievances", ["category"])
    op.create_index("ix_grievances_status", "grievances", ["status"])
    op.create_index("ix_grievances_priority", "grievances", ["priority"])
    op.create_index("ix_grievances_ward_id", "grievances", ["ward_id"])


def downgrade() -> None:
    op.drop_index("ix_grievances_ward_id", table_name="grievances")
    op.drop_index("ix_grievances_priority", table_name="grievances")
    op.drop_index("ix_grievances_status", table_name="grievances")
    op.drop_index("ix_grievances_category", table_name="grievances")
    op.drop_table("grievances")
    op.drop_table("wards")
    op.drop_table("users")
