-- ============================================================
-- KIRAYA
-- Migration: payments
--
-- Purpose:
-- Records money received from tenants or other parties.
--
-- IMPORTANT:
-- A payment is independent from a bill.
--
-- Allocation to bills happens through payment_allocations.
--
-- This allows:
--   Payment > Bill
--   Payment < Bill
--   Payment across multiple bills
--   Advance/credit payments
-- ============================================================

create table kiraya.payments (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    payment_method_id uuid
        not null
        references kiraya.payment_methods(id)
        on delete restrict,

    payment_number text
        not null,

    payment_date date
        not null,

    amount numeric(18,2)
        not null,

    currency_code text
        not null default 'INR',

    status kiraya.payment_status
        not null default 'POSTED',

    reference_number text,

    bank_name text,

    cheque_number text,

    transaction_reference text,

    received_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint payments_number_check
        check (length(trim(payment_number)) > 0),

    constraint payments_amount_check
        check (amount > 0),

    constraint payments_currency_check
        check (currency_code ~ '^[A-Z]{3}$'),

    constraint payments_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create unique index payments_org_number_unique_idx
    on kiraya.payments (
        organization_id,
        lower(trim(payment_number))
    );

create index payments_organization_idx
    on kiraya.payments (organization_id);

create index payments_tenant_date_idx
    on kiraya.payments (
        tenant_id,
        payment_date desc
    );

create index payments_method_idx
    on kiraya.payments (payment_method_id);

create index payments_status_idx
    on kiraya.payments (
        organization_id,
        status
    );

create index payments_reference_idx
    on kiraya.payments (transaction_reference)
    where transaction_reference is not null;

comment on table kiraya.payments is
    'Tenant payment receipts independent of individual bills.';

comment on column kiraya.payments.payment_number is
    'Human-readable unique payment receipt number.';

comment on column kiraya.payments.amount is
    'Total amount received in this payment.';

comment on column kiraya.payments.reference_number is
    'Optional external receipt/reference number.';

comment on column kiraya.payments.transaction_reference is
    'Bank, UPI, gateway or other transaction reference.';

comment on column kiraya.payments.received_by is
    'Kiraya user who recorded the payment.';