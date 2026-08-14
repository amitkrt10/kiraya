-- ============================================================
-- KIRAYA
-- Migration: property_types
--
-- Purpose:
-- Configurable property categories.
--
-- Examples:
--   Residential
--   Commercial
--   Industrial
--   Land
--   Mixed Use
-- ============================================================

create table kiraya.property_types (
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

    is_system boolean
        not null default false,

    is_active boolean
        not null default true,

    sort_order integer
        not null default 0,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint property_types_code_check
        check (length(trim(code)) > 0),

    constraint property_types_name_check
        check (length(trim(name)) > 0),

    constraint property_types_sort_order_check
        check (sort_order >= 0)
);

-- System types can exist once globally.
create unique index property_types_system_code_unique_idx
    on kiraya.property_types (lower(trim(code)))
    where is_system = true;

-- Client-specific types are unique within that organization.
create unique index property_types_org_code_unique_idx
    on kiraya.property_types (
        organization_id,
        lower(trim(code))
    )
    where is_system = false;

create index property_types_organization_idx
    on kiraya.property_types (organization_id);

create index property_types_active_idx
    on kiraya.property_types (
        organization_id,
        is_active,
        sort_order
    );

comment on table kiraya.property_types is
    'Configurable categories used to classify properties.';

comment on column kiraya.property_types.organization_id is
    'Organization owning a custom property type. NULL for system types.';

comment on column kiraya.property_types.is_system is
    'Indicates a Kiraya-provided system property type.';

comment on column kiraya.property_types.sort_order is
    'Display ordering for property types.';