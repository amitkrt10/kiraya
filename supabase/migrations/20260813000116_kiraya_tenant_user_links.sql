-- ============================================================
-- KIRAYA
-- Migration: tenant_user_links
--
-- Purpose:
-- Links a Kiraya tenant to a Supabase Auth profile.
--
-- The tenant may optionally be given login credentials.
--
-- A tenant record existing in Kiraya DOES NOT automatically
-- create a login account.
--
-- Example:
--
-- Tenant
--   Rahul Sharma
--       │
--       ▼
-- tenant_user_links
--       │
--       ▼
-- Profile
--       │
--       ▼
-- auth.users
--
-- This allows the client to decide whether to give the tenant
-- portal credentials.
-- ============================================================

create table kiraya.tenant_user_links (
    id uuid primary key
        default gen_random_uuid(),

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete cascade,

    profile_id uuid
        not null
        references kiraya.profiles(id)
        on delete restrict,

    is_primary boolean
        not null default true,

    is_active boolean
        not null default true,

    linked_at timestamptz
        not null default now(),

    unlinked_at timestamptz,

    notes text,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint tenant_user_links_dates_check
        check (
            unlinked_at is null
            or unlinked_at >= linked_at
        )
);

-- A profile can be linked to a tenant only once.
create unique index tenant_user_links_tenant_profile_unique_idx
    on kiraya.tenant_user_links (
        tenant_id,
        profile_id
    );

-- A tenant can have only one active primary login.
create unique index tenant_user_links_primary_active_unique_idx
    on kiraya.tenant_user_links (tenant_id)
    where is_primary = true
      and is_active = true;

create index tenant_user_links_profile_idx
    on kiraya.tenant_user_links (profile_id);

create index tenant_user_links_tenant_idx
    on kiraya.tenant_user_links (tenant_id);

create index tenant_user_links_active_idx
    on kiraya.tenant_user_links (
        tenant_id,
        is_active
    );

comment on table kiraya.tenant_user_links is
    'Links tenants to Supabase Auth profiles when tenant portal access is enabled.';

comment on column kiraya.tenant_user_links.tenant_id is
    'Tenant receiving portal access.';

comment on column kiraya.tenant_user_links.profile_id is
    'Supabase/Kiraya profile associated with the tenant login.';

comment on column kiraya.tenant_user_links.is_primary is
    'Indicates the primary profile used for tenant portal access.';

comment on column kiraya.tenant_user_links.is_active is
    'Whether this tenant-profile relationship is currently active.';

comment on column kiraya.tenant_user_links.unlinked_at is
    'Timestamp when the tenant-profile relationship was disabled.';