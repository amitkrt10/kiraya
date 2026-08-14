-- ============================================================
-- KIRAYA
-- Migration: bills
--
-- Purpose:
-- Historical bill header.
--
-- IMPORTANT:
-- Once finalized, the bill represents a historical financial
-- snapshot. Later rent-rate, utility-rate, tenant, or lease
-- changes must not modify the finalized bill.
--
-- Outstanding balance is ultimately determined from the
-- financial ledger/payment allocation system.
-- ============================================================

create table kiraya.bills (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    billing_run_id uuid
        references kiraya.billing_runs(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    unit_id uuid
        not null
        references kiraya.units(id)
        on delete restrict,

    bill_number text
        not null,

    period_start date
        not null,

    period_end date
        not null,

    bill_date date
        not null,

    due_date date,

    status kiraya.bill_status
        not null default 'DRAFT',

    subtotal numeric(18,2)
        not null default 0,

    discount_amount numeric(18,2)
        not null default 0,

    adjustment_amount numeric(18,2)
        not null default 0,

    previous_balance_amount numeric(18,2)
        not null default 0,

    total_amount numeric(18,2)
        not null default 0,

    currency_code text
        not null default 'INR',

    finalized_at timestamptz,

    finalized_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint bills_number_check
        check (
            length(trim(bill_number)) > 0
        ),

    constraint bills_period_check
        check (
            period_end >= period_start
        ),

    constraint bills_due_date_check
        check (
            due_date is null
            or due_date >= bill_date
        ),

    constraint bills_subtotal_check
        check (subtotal >= 0),

    constraint bills_discount_check
        check (discount_amount >= 0),

    constraint bills_total_check
        check (total_amount >= 0),

    constraint bills_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint bills_finalization_check
        check (
            status = 'DRAFT'
            or finalized_at is not null
        ),

    constraint bills_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index bills_org_number_unique_idx
    on kiraya.bills (
        organization_id,
        lower(trim(bill_number))
    );

create index bills_organization_idx
    on kiraya.bills (organization_id);

create index bills_billing_run_idx
    on kiraya.bills (billing_run_id);

create index bills_lease_idx
    on kiraya.bills (lease_id);

create index bills_tenant_idx
    on kiraya.bills (tenant_id);

create index bills_unit_idx
    on kiraya.bills (unit_id);

create index bills_period_idx
    on kiraya.bills (
        organization_id,
        period_start,
        period_end
    );

create index bills_status_idx
    on kiraya.bills (
        organization_id,
        status
    );

create index bills_tenant_period_idx
    on kiraya.bills (
        tenant_id,
        period_start desc
    );

comment on table kiraya.bills is
    'Historical tenant bill headers.';

comment on column kiraya.bills.bill_number is
    'Human-readable unique bill number.';

comment on column kiraya.bills.previous_balance_amount is
    'Previous outstanding balance or credit brought into this bill.';

comment on column kiraya.bills.total_amount is
    'Final gross amount represented by the bill after adjustments and previous balance.';

comment on column kiraya.bills.finalized_at is
    'Timestamp at which the bill became a financial snapshot.';

comment on column kiraya.bills.finalized_by is
    'User who finalized the bill.';