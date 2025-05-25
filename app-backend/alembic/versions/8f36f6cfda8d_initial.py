"""initial

Revision ID: 8f36f6cfda8d
Revises: 7387f91b3774
Create Date: 2025-05-21 19:52:58.530128

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f36f6cfda8d'
down_revision: Union[str, None] = '7387f91b3774'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column('documents', sa.Column('author', sa.String(), nullable=True))

def downgrade():
    op.drop_column('documents', 'author')
