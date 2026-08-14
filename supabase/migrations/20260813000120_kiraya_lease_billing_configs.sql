-- ============================================================
-- KIRAYA
-- Migration: lease_billing_configs
--
-- Purpose:
-- Stores lease-specific billing behavior.
--
-- Supports:
--   1. Monthly billing on a fixed day such as the 1st.
--   2. Date-to-date billing.
--   3. Calendar-day proration.
--   4. Fixed 30-day proration.
--   5. No proration.
--
-- The billing engine uses this configuration when generating
-- bills.
-- ============================================================

create table kiraya.lease_billing_configs (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete cascade,

    billing_frequency kiraya.billing_frequency
        not null default 'MONTHLY',

    billing_day smallint,

    billing_anchor_month smallint,

    proration_method kiraya.proration_method
        not null default 'CALENDAR_DAYS',

    first_bill_prorate boolean
        not null default true,

    final_bill_prorate boolean
        not null default true,

    bill_in_advance boolean
        not null default false,

    due_days_after_bill smallint
        not null default 0,

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

    constraint lease_billing_configs_billing_day_check
        check (
            billing_day is null
            or billing_day between 1 and 31
        ),

    constraint lease_billing_configs_anchor_month_check
        check (
            billing_anchor_month is null
            or billing_anchor_month between 1 and 12
        ),

    constraint lease_billing_configs_due_days_check
        check (
            due_days_after_bill >= 0
            and due_days_after_bill <= 365
        ),

    constraint lease_billing_configs_date_check
        check (
            effective_to is null
            or effective_to >= effective_from
        ),

    constraint lease_billing_configs_monthly_day_check
        check (
            billing_frequency <> 'MONTHLY'
            or billing_day is not null
        ),

    constraint lease_billing_configs_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index lease_billing_configs_organization_idx
    on kiraya.lease_billing_configs (organization_id);

create index lease_billing_configs_lease_idx
    on kiraya.lease_billing_configs (
        lease_id,
        effective_from
    );

create index lease_billing_configs_active_idx
    on kiraya.lease_billing_configs (
        lease_id,
        is_active,
        effective_from
    );

comment on table kiraya.lease_billing_configs is
    'Lease-specific configuration controlling billing periods, due dates and rent proration.';

comment on column kiraya.lease_billing_configs.billing_day is
    'Day of month on which recurring monthly bills are generated.';

comment on column kiraya.lease_billing_configs.billing_anchor_month is
    'Optional month anchor for non-monthly recurring billing.';

comment on column kiraya.lease_billing_configs.proration_method is
    'Method used to calculate partial-period rent.';

comment on column kiraya.lease_billing_configs.first_bill_prorate is
    'Whether the first bill should prorate rent when occupancy begins partway through a billing period.';

comment on column kiraya.lease_billing_configs.final_bill_prorate is
    'Whether the final bill should prorate rent when occupancy ends partway through a billing period.';

comment on column kiraya.lease_billing_configs.bill_in_advance is
    'Whether recurring rent is billed before the occupancy period rather than after it.';

comment on column kiraya.lease_billing_configs.due_days_after_bill is
    'Number of days after bill date that payment becomes due.';