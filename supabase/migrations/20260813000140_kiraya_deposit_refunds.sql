-- ============================================================
-- KIRAYA
-- Migration: deposit_refunds
--
-- Purpose:
-- Tracks actual security deposit refunds made to tenants.
--
-- Example:
--
-- Deposit received       ₹60,000
-- Damage deduction       ₹10,000
-- Previous dues           ₹5,000
-- Refund                  ₹45,000
--
-- Refunds are recorded independently from the settlement
-- because the actual money transfer may happen later.
-- ============================================================

create table kiraya.deposit_refunds (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    security_deposit_id uuid
        not null
        references kiraya.security_deposits(id)
        on delete restrict,

    tenant_exit_id uuid
        not null
        references kiraya.tenant_exits(id)
        on delete restrict,

    exit_settlement_id uuid
        not null
        references kiraya.exit_settlements(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    refund_reference text
        not null,

    refund_date date,

    amount numeric(18,2)
        not null,

    currency_code text
        not null default 'INR',

    payment_method_id uuid
        references kiraya.payment_methods(id)
        on delete restrict,

    status text
        not null default 'PENDING',

    transaction_reference text,

    processed_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint deposit_refunds_reference_check
        check (
            length(trim(refund_reference)) > 0
        ),

    constraint deposit_refunds_amount_check
        check (
            amount > 0
        ),

    constraint deposit_refunds_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint deposit_refunds_status_check
        check (
            status in (
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                'CANCELLED'
            )
        ),

    constraint deposit_refunds_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index deposit_refunds_org_reference_unique_idx
    on kiraya.deposit_refunds (
        organization_id,
        lower(trim(refund_reference))
    );

create index deposit_refunds_organization_idx
    on kiraya.deposit_refunds (organization_id);

create index deposit_refunds_deposit_idx
    on kiraya.deposit_refunds (security_deposit_id);

create index deposit_refunds_exit_idx
    on kiraya.deposit_refunds (tenant_exit_id);

create index deposit_refunds_settlement_idx
    on kiraya.deposit_refunds (exit_settlement_id);

create index deposit_refunds_tenant_idx
    on kiraya.deposit_refunds (tenant_id);

create index deposit_refunds_status_idx
    on kiraya.deposit_refunds (
        organization_id,
        status
    );

comment on table kiraya.deposit_refunds is
    'Actual security deposit refund transactions made after tenant exit.';

comment on column kiraya.deposit_refunds.amount is
    'Amount being returned to the tenant.';

comment on column kiraya.deposit_refunds.status is
    'Lifecycle status of the actual refund transaction.';

comment on column kiraya.deposit_refunds.transaction_reference is
    'Bank, UPI, cheque or other external refund reference.';