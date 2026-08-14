-- ============================================================
-- KIRAYA
-- Migration: role_permissions
--
-- Purpose:
-- Many-to-many relationship between roles and permissions.
-- ============================================================

create table kiraya.role_permissions (
    role_id uuid
        not null
        references kiraya.roles(id)
        on delete cascade,

    permission_id uuid
        not null
        references kiraya.permissions(id)
        on delete cascade,

    created_at timestamptz
        not null default now(),

    primary key (
        role_id,
        permission_id
    )
);

create index role_permissions_permission_id_idx
    on kiraya.role_permissions (permission_id);

comment on table kiraya.role_permissions is
    'Maps roles to the permissions granted to those roles.';