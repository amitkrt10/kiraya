-- ============================================================
-- KIRAYA
-- Migration: meters
--
-- Purpose:
-- Physical/logical meters associated with properties or units.
--
-- A meter may be:
--   SUB_METER
--   SELF_METER
--   FIXED
--   OTHER
--
-- Typical case:
--
-- Property
--   └── Flat 101
--         └── Electricity Meter
-- ============================================================

create table kiraya.meters (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    utility_id uuid
        not null
        references kiraya.utilities(id)
        on delete restrict,

    property_id uuid
        references kiraya.properties(id)
        on delete restrict,

    unit_id uuid
        references kiraya.units(id)
        on delete restrict,

    meter_code text
        not null,

    meter_type kiraya.meter_type
        not null,

    serial_number text,

    unit_name text
        not null default 'unit',

    multiplier numeric(18,6)
        not null default 1,

    installed_on date,

    removed_on date,

    initial_reading numeric(18,6),

    is_active boolean
        not null default true,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint meters_scope_check
        check (
            property_id is not null
            or unit_id is not null
        ),

    constraint meters_multiplier_check
        check (multiplier > 0),

    constraint meters_initial_reading_check
        check (
            initial_reading is null
            or initial_reading >= 0
        ),

    constraint meters_installation_dates_check
        check (
            removed_on is null
            or installed_on is null
            or removed_on >= installed_on
        ),

    constraint meters_unit_name_check
        check (length(trim(unit_name)) > 0),

    constraint meters_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create unique index meters_org_code_unique_idx
    on kiraya.meters (
        organization_id,
        lower(trim(meter_code))
    );

create index meters_organization_idx
    on kiraya.meters (organization_id);

create index meters_utility_idx
    on kiraya.meters (utility_id);

create index meters_property_idx
    on kiraya.meters (property_id);

create index meters_unit_idx
    on kiraya.meters (unit_id);

create index meters_active_idx
    on kiraya.meters (
        organization_id,
        is_active
    );

comment on table kiraya.meters is
    'Physical or logical meters used to measure tenant-chargeable utilities.';

comment on column kiraya.meters.meter_code is
    'Unique meter identifier within an organization.';

comment on column kiraya.meters.serial_number is
    'Manufacturer or physical meter serial number.';

comment on column kiraya.meters.multiplier is
    'Multiplier applied to raw meter consumption.';

comment on column kiraya.meters.initial_reading is
    'Optional reading recorded when the meter was installed or entered into Kiraya.';