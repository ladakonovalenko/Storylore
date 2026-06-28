"""add users and owner_id to projects

Revision ID: 0e714f30e10f
Revises: da5374b07008
Create Date: 2026-06-26 10:51:15.243071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e714f30e10f'
down_revision: Union[str, Sequence[str], None] = 'da5374b07008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Створюємо таблицю users
    op.create_table('users',
        sa.Column('id',            sa.Integer(),  nullable=False),
        sa.Column('email',         sa.String(),   nullable=False),
        sa.Column('username',      sa.String(),   nullable=False),
        sa.Column('password_hash', sa.String(),   nullable=False),
        sa.Column('is_active',     sa.Boolean(),  nullable=True),
        sa.Column('created_at',    sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'),    'users', ['id'],    unique=False)

    # ✅ SQLite не підтримує ADD FOREIGN KEY — використовуємо batch mode
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('owner_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_projects_owner', 'users', ['owner_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('projects') as batch_op:
        batch_op.drop_constraint('fk_projects_owner', type_='foreignkey')
        batch_op.drop_column('owner_id')

    op.drop_index(op.f('ix_users_id'),    table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')