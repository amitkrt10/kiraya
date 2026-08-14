-- ============================================================
-- KIRAYA
-- Migration: billing_runs
--
-- Purpose:
-- Represents one bulk billing operation.
--
-- Example:
--
-- August 2026 Billing Run
--   ├── Tenant A → Bill
--   ├── Tenant B → Bill
--   ├── Tenant C → Bill
--   └── Tenant D → Bill
--
-- A run may be generated for one property or an entire
-- organization.
-- ============================================================

create table kiraya.billing_runs (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    property_id uuid
        references kiraya.properties(id)
        on delete restrict,

    run_code text
        not null,

    period_start date
        not null,

    period_end date
        not null,

    bill_date date
        not null,

    due_date date,

    status kiraya.billing_run_status
        not null default 'DRAFT',

    started_at timestamptz,

    completed_at timestamptz,

    initiated_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    total_bills integer
        not null default 0,

    successful_bills integer
        not null default 0,

    failed_bills integer
        not null default 0,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint billing_runs_code_check
        check (
            length(trim(run_code)) > 0
        ),

    constraint billing_runs_period_check
        check (
            period_end >= period_start
        ),

    constraint billing_runs_due_date_check
        check (
            due_date is null
            or due_date >= bill_date
        ),

    constraint billing_runs_total_bills_check
        check (total_bills >= 0),

    constraint billing_runs_successful_bills_check
        check (successful_bills >= 0),

    constraint billing_runs_failed_bills_check
        check (failed_bills >= 0),

    constraint billing_runs_counts_check
        check (
            successful_bills + failed_bills <= total_bills
        ),

    constraint billing_runs_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index billing_runs_org_code_unique_idx
    on kiraya.billing_runs (
        organization_id,
        lower(trim(run_code))
    );

create index billing_runs_organization_idx
    on kiraya.billing_runs (organization_id);

create index billing_runs_property_idx
    on kiraya.billing_runs (property_id);

create index billing_runs_period_idx
    on kiraya.billing_runs (
        organization_id,
        period_start,
        period_end
    );

create index billing_runs_status_idx
    on kiraya.billing_runs (
        organization_id,
        status
    );

comment on table kiraya.billing_runs is
    'Bulk billing operation used to generate bills for a billing period.';

comment on column kiraya.billing_runs.run_code is
    'Unique identifier for the billing operation.';

comment on column kiraya.billing_runs.period_start is
    'Start date of the billing period.';

comment on column kiraya.billing_runs.period_end is
    'End date of the billing period.';

comment on column kiraya.billing_runs.bill_date is
    'Date on which generated bills are issued.';

comment on column kiraya.billing_runs.total_bills is
    'Number of bills expected to be generated.';

comment on column kiraya.billing_runs.successful_bills is
    'Number of bills successfully generated.';

comment on column kiraya.billing_runs.failed_bills is
    'Number of bills that failed generation.';