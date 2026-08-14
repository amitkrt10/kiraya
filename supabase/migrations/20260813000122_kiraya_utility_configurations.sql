-- ============================================================
-- KIRAYA
-- Migration: utility_configurations
--
-- Purpose:
-- Defines how a utility is applied to a property/unit.
--
-- Supports:
--   SUB_METER
--   SELF_METER
--   FIXED
--   OTHER
--
-- Example:
--
-- Flat 101
--   Electricity → SUB_METER
--   Water       → FIXED
--   Maintenance → FIXED
-- ============================================================

create table kiraya.utility_configurations (
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

    meter_type kiraya.meter_type
        not null default 'FIXED',

    fixed_amount numeric(18,2),

    is_tenant_chargeable boolean
        not null default true,

    is_active boolean
        not null default true,

    effective_from date
        not null default current_date,

    effective_to date,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint utility_configurations_scope_check
        check (
            property_id is not null
            or unit_id is not null
        ),

    constraint utility_configurations_fixed_amount_check
        check (
            meter_type <> 'FIXED'
            or fixed_amount is not null
        ),

    constraint utility_configurations_amount_positive_check
        check (
            fixed_amount is null
            or fixed_amount >= 0
        ),

    constraint utility_configurations_date_check
        check (
            effective_to is null
            or effective_to >= effective_from
        ),

    constraint utility_configurations_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index utility_configurations_organization_idx
    on kiraya.utility_configurations (organization_id);

create index utility_configurations_utility_idx
    on kiraya.utility_configurations (utility_id);

create index utility_configurations_property_idx
    on kiraya.utility_configurations (property_id);

create index utility_configurations_unit_idx
    on kiraya.utility_configurations (unit_id);

create index utility_configurations_active_idx
    on kiraya.utility_configurations (
        organization_id,
        is_active,
        effective_from
    );

comment on table kiraya.utility_configurations is
    'Defines how a utility is configured and charged for a property or unit.';

comment on column kiraya.utility_configurations.property_id is
    'Property-level utility configuration.';

comment on column kiraya.utility_configurations.unit_id is
    'Unit-level utility configuration.';

comment on column kiraya.utility_configurations.meter_type is
    'Charging mechanism: sub-meter, self-meter, fixed, or other.';

comment on column kiraya.utility_configurations.fixed_amount is
    'Fixed recurring amount when meter_type is FIXED.';

comment on column kiraya.utility_configurations.is_tenant_chargeable is
    'Whether the configured utility should be eligible for tenant billing.';