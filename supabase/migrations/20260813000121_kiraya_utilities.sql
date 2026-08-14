-- ============================================================
-- KIRAYA
-- Migration: utilities
--
-- Purpose:
-- Master catalog of chargeable utility/expense types.
--
-- Examples:
--   Electricity
--   Water
--   Maintenance
--   Gas
--   Parking
--   Waste
--   Other
--
-- Organizations can use system utilities or create their own.
-- ============================================================

create table kiraya.utilities (
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

    unit_name text,

    is_metered boolean
        not null default false,

    is_system boolean
        not null default false,

    is_active boolean
        not null default true,

    sort_order integer
        not null default 0,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint utilities_code_check
        check (length(trim(code)) > 0),

    constraint utilities_name_check
        check (length(trim(name)) > 0),

    constraint utilities_sort_order_check
        check (sort_order >= 0),

    constraint utilities_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create unique index utilities_system_code_unique_idx
    on kiraya.utilities (lower(trim(code)))
    where is_system = true;

create unique index utilities_org_code_unique_idx
    on kiraya.utilities (
        organization_id,
        lower(trim(code))
    )
    where is_system = false;

create index utilities_organization_idx
    on kiraya.utilities (organization_id);

create index utilities_active_idx
    on kiraya.utilities (
        organization_id,
        is_active,
        sort_order
    );

comment on table kiraya.utilities is
    'Configurable utility and recurring expense categories used for tenant billing.';

comment on column kiraya.utilities.unit_name is
    'Unit used when calculating a metered charge, e.g. kWh, litre, unit.';

comment on column kiraya.utilities.is_metered is
    'Whether this utility can be calculated from meter readings.';

comment on column kiraya.utilities.is_system is
    'Whether this utility is provided by Kiraya as a system utility.';