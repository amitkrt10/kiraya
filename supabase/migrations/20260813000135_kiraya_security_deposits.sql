-- ============================================================
-- KIRAYA
-- Migration: security_deposits
--
-- Purpose:
-- Security deposit requirement for a lease.
--
-- The actual money received is tracked separately through
-- security_deposit_transactions.
--
-- This supports:
--
-- Required deposit = ₹60,000
--
-- Payment 1 = ₹30,000
-- Payment 2 = ₹20,000
-- Payment 3 = ₹10,000
--
-- Received = ₹60,000
-- ============================================================

create table kiraya.security_deposits (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    deposit_reference text
        not null,

    required_amount numeric(18,2)
        not null default 0,

    currency_code text
        not null default 'INR',

    status kiraya.deposit_status
        not null default 'PENDING',

    received_amount numeric(18,2)
        not null default 0,

    deducted_amount numeric(18,2)
        not null default 0,

    refunded_amount numeric(18,2)
        not null default 0,

    outstanding_amount numeric(18,2)
        not null default 0,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint security_deposits_reference_check
        check (
            length(trim(deposit_reference)) > 0
        ),

    constraint security_deposits_required_check
        check (required_amount >= 0),

    constraint security_deposits_received_check
        check (received_amount >= 0),

    constraint security_deposits_deducted_check
        check (deducted_amount >= 0),

    constraint security_deposits_refunded_check
        check (refunded_amount >= 0),

    constraint security_deposits_outstanding_check
        check (outstanding_amount >= 0),

    constraint security_deposits_currency_check
        check (currency_code ~ '^[A-Z]{3}$'),

    constraint security_deposits_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create unique index security_deposits_org_reference_unique_idx
    on kiraya.security_deposits (
        organization_id,
        lower(trim(deposit_reference))
    );

create unique index security_deposits_lease_unique_idx
    on kiraya.security_deposits (lease_id);

create index security_deposits_organization_idx
    on kiraya.security_deposits (organization_id);

create index security_deposits_tenant_idx
    on kiraya.security_deposits (tenant_id);

create index security_deposits_status_idx
    on kiraya.security_deposits (
        organization_id,
        status
    );

comment on table kiraya.security_deposits is
    'Security deposit requirement and current summarized balance for a lease.';

comment on column kiraya.security_deposits.required_amount is
    'Total security deposit required under the lease.';

comment on column kiraya.security_deposits.received_amount is
    'Total deposit money received so far.';

comment on column kiraya.security_deposits.deducted_amount is
    'Total amount deducted during tenant exit/settlement.';

comment on column kiraya.security_deposits.refunded_amount is
    'Total amount returned to the tenant.';

comment on column kiraya.security_deposits.outstanding_amount is
    'Current deposit amount still expected to be received.';