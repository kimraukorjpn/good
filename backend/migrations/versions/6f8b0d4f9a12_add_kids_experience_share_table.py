"""add kids experience share table

Revision ID: 6f8b0d4f9a12
Revises: 1c722f5f3e76
Create Date: 2026-08-20 15:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "6f8b0d4f9a12"
down_revision: Union[str, Sequence[str], None] = "1c722f5f3e76"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "kids_experience_shares",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("share_token", sa.String(length=64), nullable=False),
        sa.Column("participant_name", sa.String(length=40), nullable=False),
        sa.Column(
            "draft_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "result_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_kids_experience_shares_share_token"), "kids_experience_shares", ["share_token"], unique=True)
    op.create_index(op.f("ix_kids_experience_shares_participant_name"), "kids_experience_shares", ["participant_name"], unique=False)
    op.create_index(op.f("ix_kids_experience_shares_created_at"), "kids_experience_shares", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_kids_experience_shares_created_at"), table_name="kids_experience_shares")
    op.drop_index(op.f("ix_kids_experience_shares_participant_name"), table_name="kids_experience_shares")
    op.drop_index(op.f("ix_kids_experience_shares_share_token"), table_name="kids_experience_shares")
    op.drop_table("kids_experience_shares")
