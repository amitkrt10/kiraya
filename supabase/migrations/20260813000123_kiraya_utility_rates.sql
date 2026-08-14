-- ============================================================
-- KIRAYA
-- Migration: utility_rates
--
-- Purpose:
-- Stores historical and future utility rates.
--
-- Example:
--
-- Electricity
--   01-Apr-2026 → ₹8.00 / unit
--   01-Apr-2027 → ₹9.00 / unit
--
-- Historical bills will snapshot the rate actually used.
-- Changing a rate must never change an already finalized bill.
-- ============================================================

create table kiraya.utility_rates (
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

    utility_configuration_id uuid
        references kiraya.utility_configurations(id)
        on delete restrict,

    rate numeric(18,6)
        not null,

    unit_name text
        not null,

    effective_from date
        not null,

    effective_to date,

    is_active boolean
        not null default true,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint utility_rates_rate_check
        check (rate >= 0),

    constraint utility_rates_unit_name_check
        check (length(trim(unit_name)) > 0),

    constraint utility_rates_date_check
        check (
            effective_to is null
            or effective_to >= effective_from
        ),

    constraint utility_rates_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index utility_rates_organization_idx
    on kiraya.utility_rates (organization_id);

create index utility_rates_utility_idx
    on kiraya.utility_rates (
        utility_id,
        effective_from
    );

create index utility_rates_configuration_idx
    on kiraya.utility_rates (
        utility_configuration_id,
        effective_from
    );

create index utility_rates_active_idx
    on kiraya.utility_rates (
        utility_id,
        is_active,
        effective_from
    );

comment on table kiraya.utility_rates is
    'Historical and scheduled rates for metered or unit-based utilities.';

comment on column kiraya.utility_rates.rate is
    'Price per configured unit.';

comment on column kiraya.utility_rates.unit_name is
    'Unit to which the rate applies, e.g. kWh.';

comment on column kiraya.utility_rates.effective_from is
    'Date from which this rate may be used.';

comment on column kiraya.utility_rates.effective_to is
    'Optional final date for this rate.';