-- ============================================================
-- KIRAYA
-- Migration: organization_member_roles
--
-- Purpose:
-- Assigns organization-scoped roles to organization members.
--
-- Important:
-- Additional validation will ensure that the assigned role:
--   1. Is an ORGANIZATION-scoped role.
--   2. Belongs to the same organization as the member.
-- ============================================================

create table kiraya.organization_member_roles (
    organization_member_id uuid
        not null
        references kiraya.organization_members(id)
        on delete cascade,

    role_id uuid
        not null
        references kiraya.roles(id)
        on delete cascade,

    created_at timestamptz
        not null default now(),

    primary key (
        organization_member_id,
        role_id
    )
);

create index organization_member_roles_role_id_idx
    on kiraya.organization_member_roles (role_id);

comment on table kiraya.organization_member_roles is
    'Assigns organization-scoped roles to organization members.';

comment on column kiraya.organization_member_roles.organization_member_id is
    'Organization membership receiving the role.';

comment on column kiraya.organization_member_roles.role_id is
    'Organization-scoped role assigned to the member.';