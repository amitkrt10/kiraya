-- ============================================================
-- KIRAYA
-- Migration: permissions
--
-- Purpose:
-- System and organization permission catalog.
-- Permissions are assigned to roles.
-- ============================================================

create table kiraya.permissions (
    id uuid primary key
        default gen_random_uuid(),

    code text
        not null,

    name text
        not null,

    description text,

    resource text
        not null,

    action text
        not null,

    is_system boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    constraint permissions_code_check
        check (length(trim(code)) > 0),

    constraint permissions_name_check
        check (length(trim(name)) > 0),

    constraint permissions_resource_check
        check (length(trim(resource)) > 0),

    constraint permissions_action_check
        check (length(trim(action)) > 0)
);

create unique index permissions_code_unique_idx
    on kiraya.permissions (code);

create index permissions_resource_action_idx
    on kiraya.permissions (resource, action);

comment on table kiraya.permissions is
    'Permission catalog used by Kiraya role-based authorization.';

comment on column kiraya.permissions.code is
    'Unique permission identifier, e.g. billing.finalize.';

comment on column kiraya.permissions.resource is
    'Resource controlled by the permission, e.g. billing.';

comment on column kiraya.permissions.action is
    'Action allowed on the resource, e.g. view, create, finalize.';

comment on column kiraya.permissions.is_system is
    'Whether the permission is a Kiraya system-defined permission.';