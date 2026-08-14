-- ============================================================
-- KIRAYA
-- Migration: roles
--
-- Purpose:
-- Defines platform-level and organization-level roles.
--
-- PLATFORM:
--   organization_id must be NULL.
--
-- ORGANIZATION:
--   organization_id must reference an organization.
-- ============================================================

create table kiraya.roles (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        references kiraya.organizations(id)
        on delete cascade,

    code text
        not null,

    name text
        not null,

    description text,

    scope kiraya.role_scope
        not null,

    is_system boolean
        not null default false,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint roles_scope_organization_check
        check (
            (
                scope = 'PLATFORM'
                and organization_id is null
            )
            or
            (
                scope = 'ORGANIZATION'
                and organization_id is not null
            )
        ),

    constraint roles_code_check
        check (length(trim(code)) > 0),

    constraint roles_name_check
        check (length(trim(name)) > 0)
);

-- One platform role code can exist only once.
create unique index roles_platform_code_unique_idx
    on kiraya.roles (code)
    where scope = 'PLATFORM';

-- The same role code can exist in different organizations,
-- but not twice within the same organization.
create unique index roles_organization_code_unique_idx
    on kiraya.roles (
        organization_id,
        code
    )
    where scope = 'ORGANIZATION';

create index roles_organization_id_idx
    on kiraya.roles (organization_id);

create index roles_scope_idx
    on kiraya.roles (scope);

comment on table kiraya.roles is
    'Platform-level and organization-level roles used for authorization.';

comment on column kiraya.roles.organization_id is
    'Organization owning the role. NULL for platform-level roles.';

comment on column kiraya.roles.code is
    'Stable machine-readable role identifier, e.g. SUPER_ADMIN or ACCOUNTANT.';

comment on column kiraya.roles.scope is
    'Defines whether the role is platform-wide or organization-specific.';

comment on column kiraya.roles.is_system is
    'Whether the role is provided by Kiraya rather than created by a client.';