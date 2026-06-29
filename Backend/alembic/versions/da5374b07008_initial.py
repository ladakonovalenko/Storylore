"""initial

Revision ID: da5374b07008
Revises: 
Create Date: 2026-06-26 10:33:52.998220

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'da5374b07008'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('projects',
        sa.Column('id',          sa.Integer(),  nullable=False),
        sa.Column('title',       sa.String(),   nullable=True),
        sa.Column('description', sa.String(),   nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_id'),    'projects', ['id'],    unique=False)
    op.create_index(op.f('ix_projects_title'), 'projects', ['title'], unique=False)

    op.create_table('factions',
        sa.Column('id',          sa.Integer(), nullable=False),
        sa.Column('project_id',  sa.Integer(), nullable=True),
        sa.Column('name',        sa.String(),  nullable=True),
        sa.Column('description', sa.String(),  nullable=True),
        sa.Column('type',        sa.String(),  nullable=True),
        sa.Column('alignment',   sa.String(),  nullable=True),
        sa.Column('leader',      sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_factions_id'),   'factions', ['id'],   unique=False)
    op.create_index(op.f('ix_factions_name'), 'factions', ['name'], unique=False)

    op.create_table('locations',
        sa.Column('id',          sa.Integer(), nullable=False),
        sa.Column('project_id',  sa.Integer(), nullable=True),
        sa.Column('name',        sa.String(),  nullable=True),
        sa.Column('type',        sa.String(),  nullable=True),
        sa.Column('description', sa.Text(),    nullable=True),
        sa.Column('x',           sa.Float(),   nullable=True),
        sa.Column('y',           sa.Float(),   nullable=True),
        sa.Column('color',       sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_locations_id'),   'locations', ['id'],   unique=False)
    op.create_index(op.f('ix_locations_name'), 'locations', ['name'], unique=False)

    op.create_table('location_relationships',
        sa.Column('id',                sa.Integer(), nullable=False),
        sa.Column('location_id',       sa.Integer(), nullable=True),
        sa.Column('target_id',         sa.Integer(), nullable=True),
        sa.Column('relationship_type', sa.String(),  nullable=False),
        sa.Column('strength',          sa.Integer(), nullable=True),
        sa.Column('description',       sa.Text(),    nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_id'],   ['locations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_location_relationships_id'), 'location_relationships', ['id'], unique=False)

    op.create_table('characters',
        sa.Column('id',                        sa.Integer(), nullable=False),
        sa.Column('project_id',                sa.Integer(), nullable=True),
        sa.Column('faction_id',                sa.Integer(), nullable=True),
        sa.Column('name',                      sa.String(),  nullable=False),
        sa.Column('role',                      sa.String(),  nullable=True),
        sa.Column('is_favorite',               sa.Boolean(), nullable=True),
        sa.Column('tags',                      sa.String(),  nullable=True),
        sa.Column('status',                    sa.String(),  nullable=True),
        sa.Column('rank',                      sa.String(),  nullable=True),
        sa.Column('description',               sa.Text(),    nullable=True),
        sa.Column('appearance',                sa.Text(),    nullable=True),
        sa.Column('character_traits',          sa.Text(),    nullable=True),
        sa.Column('values_beliefs',            sa.Text(),    nullable=True),
        sa.Column('motivation_goals',          sa.Text(),    nullable=True),
        sa.Column('fears_vulnerabilities',     sa.Text(),    nullable=True),
        sa.Column('social_status',             sa.Text(),    nullable=True),
        sa.Column('family_origin',             sa.Text(),    nullable=True),
        sa.Column('relationships',             sa.Text(),    nullable=True),
        sa.Column('reputation',                sa.Text(),    nullable=True),
        sa.Column('communication_style',       sa.Text(),    nullable=True),
        sa.Column('biography',                 sa.Text(),    nullable=True),
        sa.Column('traumas',                   sa.Text(),    nullable=True),
        sa.Column('secrets',                   sa.Text(),    nullable=True),
        sa.Column('unresolved_conflicts',      sa.Text(),    nullable=True),
        sa.Column('character_arc',             sa.Text(),    nullable=True),
        sa.Column('skills',                    sa.Text(),    nullable=True),
        sa.Column('resources',                 sa.Text(),    nullable=True),
        sa.Column('physical_limitations',      sa.Text(),    nullable=True),
        sa.Column('psychological_limitations', sa.Text(),    nullable=True),
        sa.Column('habits_routines',           sa.Text(),    nullable=True),
        sa.Column('self_perception',           sa.Text(),    nullable=True),
        sa.Column('allies_perception',         sa.Text(),    nullable=True),
        sa.Column('enemies_perception',        sa.Text(),    nullable=True),
        sa.Column('contrasts',                 sa.Text(),    nullable=True),
        sa.Column('symbols',                   sa.Text(),    nullable=True),
        sa.Column('main_location',             sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['faction_id'],  ['factions.id']),
        sa.ForeignKeyConstraint(['project_id'],  ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_characters_id'),         'characters', ['id'],         unique=False)
    op.create_index(op.f('ix_characters_project_id'), 'characters', ['project_id'], unique=False)

    op.create_table('character_relationships',
        sa.Column('id',                sa.Integer(), nullable=False),
        sa.Column('character_id',      sa.Integer(), nullable=True),
        sa.Column('target_id',         sa.Integer(), nullable=True),
        sa.Column('relationship_type', sa.String(),  nullable=False),
        sa.Column('strength',          sa.Integer(), nullable=True),
        sa.Column('description',       sa.Text(),    nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_id'],    ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_character_relationships_id'), 'character_relationships', ['id'], unique=False)

    op.create_table('character_events',
        sa.Column('id',           sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('year',         sa.Integer(), nullable=True),
        sa.Column('event_title',  sa.String(),  nullable=True),
        sa.Column('description',  sa.Text(),    nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_character_events_id'),          'character_events', ['id'],          unique=False)
    op.create_index(op.f('ix_character_events_event_title'), 'character_events', ['event_title'], unique=False)

    op.create_table('relationship_history',
        sa.Column('id',              sa.Integer(), nullable=False),
        sa.Column('relationship_id', sa.Integer(), nullable=True),
        sa.Column('period_or_year',  sa.String(),  nullable=True),
        sa.Column('old_status',      sa.String(),  nullable=True),
        sa.Column('new_status',      sa.String(),  nullable=False),
        sa.Column('description',     sa.Text(),    nullable=True),
        sa.ForeignKeyConstraint(['relationship_id'], ['character_relationships.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_relationship_history_id'), 'relationship_history', ['id'], unique=False)

    op.create_table('eras',
        sa.Column('id',          sa.Integer(), nullable=False),
        sa.Column('project_id',  sa.Integer(), nullable=True),
        sa.Column('name',        sa.String(),  nullable=False),
        sa.Column('description', sa.Text(),    nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('start_year',  sa.Integer(), nullable=True),
        sa.Column('end_year',    sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_eras_id'),         'eras', ['id'],         unique=False)
    op.create_index(op.f('ix_eras_project_id'), 'eras', ['project_id'], unique=False)

    op.create_table('arcs',
        sa.Column('id',          sa.Integer(), nullable=False),
        sa.Column('project_id',  sa.Integer(), nullable=True),
        sa.Column('title',       sa.String(),  nullable=False),
        sa.Column('description', sa.Text(),    nullable=True),
        sa.Column('goal',        sa.Text(),    nullable=True),
        sa.Column('genre',       sa.String(),  nullable=True),
        sa.Column('status',      sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_arcs_id'),         'arcs', ['id'],         unique=False)
    op.create_index(op.f('ix_arcs_project_id'), 'arcs', ['project_id'], unique=False)

    op.create_table('arc_character_roles',
        sa.Column('id',           sa.Integer(), nullable=False),
        sa.Column('arc_id',       sa.Integer(), nullable=True),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('role',         sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['arc_id'],       ['arcs.id'],        ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'],  ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_arc_character_roles_id'), 'arc_character_roles', ['id'], unique=False)

    op.create_table('events',
        sa.Column('id',              sa.Integer(), nullable=False),
        sa.Column('project_id',      sa.Integer(), nullable=True),
        sa.Column('era_id',          sa.Integer(), nullable=True),
        sa.Column('arc_id',          sa.Integer(), nullable=True),
        sa.Column('title',           sa.String(),  nullable=False),
        sa.Column('description',     sa.Text(),    nullable=True),
        sa.Column('event_type',      sa.String(),  nullable=True),
        sa.Column('importance',      sa.String(),  nullable=True),
        sa.Column('tags',            sa.String(),  nullable=True),
        sa.Column('year',            sa.Integer(), nullable=True),
        sa.Column('date_label',      sa.String(),  nullable=True),
        sa.Column('is_ongoing',      sa.Boolean(), nullable=True),
        sa.Column('location',        sa.String(),  nullable=True),
        sa.Column('participant_ids', sa.String(),  nullable=True),
        sa.ForeignKeyConstraint(['arc_id'],     ['arcs.id'],     ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['era_id'],     ['eras.id'],     ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_events_id'),         'events', ['id'],         unique=False)
    op.create_index(op.f('ix_events_project_id'), 'events', ['project_id'], unique=False)

    op.create_table('event_causalities',
        sa.Column('id',              sa.Integer(), nullable=False),
        sa.Column('cause_event_id',  sa.Integer(), nullable=True),
        sa.Column('effect_event_id', sa.Integer(), nullable=True),
        sa.Column('description',     sa.Text(),    nullable=True),
        sa.ForeignKeyConstraint(['cause_event_id'],  ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['effect_event_id'], ['events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_event_causalities_id'), 'event_causalities', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('event_causalities')
    op.drop_table('events')
    op.drop_table('arc_character_roles')
    op.drop_table('arcs')
    op.drop_table('eras')
    op.drop_table('relationship_history')
    op.drop_table('character_events')
    op.drop_table('character_relationships')
    op.drop_table('characters')
    op.drop_table('location_relationships')
    op.drop_table('locations')
    op.drop_table('factions')
    op.drop_table('projects')