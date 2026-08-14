-- ============================================================
-- KIRAYA
-- Migration: unit_types
--
-- Purpose:
-- Configurable categories for units inside properties.
--
-- Examples:
--   Flat
--   Office
--   Shop
--   Warehouse
--   Land
--   Room
-- ============================================================

create table kiraya.unit_types (
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

    constraint unit_types_code_check
        check (length(trim(code)) > 0),

    constraint unit_types_name_check
        check (length(trim(name)) > 0),

    constraint unit_types_sort_order_check
        check (sort_order >= 0)
);

create unique index unit_types_system_code_unique_idx
    on kiraya.unit_types (lower(trim(code)))
    where is_system = true;

create unique index unit_types_org_code_unique_idx
    on kiraya.unit_types (
        organization_id,
        lower(trim(code))
    )
    where is_system = false;

create index unit_types_organization_idx
    on kiraya.unit_types (organization_id);

create index unit_types_active_idx
    on kiraya.unit_types (
        organization_id,
        is_active,
        sort_order
    );

comment on table kiraya.unit_types is
    'Configurable categories used to classify units within properties.';

comment on column kiraya.unit_types.organization_id is
    'Organization owning a custom unit type. NULL for system types.';

comment on column kiraya.unit_types.is_system is
    'Indicates a Kiraya-provided system unit type.';

comment on column kiraya.unit_types.sort_order is
    'Display ordering for unit types.';