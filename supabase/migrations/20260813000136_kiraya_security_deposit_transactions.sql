-- ============================================================
-- KIRAYA
-- Migration: security_deposit_transactions
--
-- Purpose:
-- Immutable transaction history for security deposits.
--
-- Supports:
--   RECEIPT
--   DEDUCTION
--   REFUND
--   ADJUSTMENT
--
-- The security_deposits table stores the current summary;
-- this table stores the underlying transaction history.
-- ============================================================

create table kiraya.security_deposit_transactions (
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

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete restrict,

    transaction_type text
        not null,

    transaction_date date
        not null,

    amount numeric(18,2)
        not null,

    currency_code text
        not null default 'INR',

    payment_id uuid
        references kiraya.payments(id)
        on delete restrict,

    exit_settlement_id uuid,

    description text
        not null,

    reference_code text,

    created_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    constraint security_deposit_transactions_type_check
        check (
            transaction_type in (
                'RECEIPT',
                'DEDUCTION',
                'REFUND',
                'ADJUSTMENT'
            )
        ),

    constraint security_deposit_transactions_amount_check
        check (
            amount > 0
        ),

    constraint security_deposit_transactions_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint security_deposit_transactions_description_check
        check (
            length(trim(description)) > 0
        ),

    constraint security_deposit_transactions_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index security_deposit_transactions_organization_idx
    on kiraya.security_deposit_transactions (organization_id);

create index security_deposit_transactions_deposit_idx
    on kiraya.security_deposit_transactions (
        security_deposit_id,
        transaction_date
    );

create index security_deposit_transactions_tenant_idx
    on kiraya.security_deposit_transactions (tenant_id);

create index security_deposit_transactions_lease_idx
    on kiraya.security_deposit_transactions (lease_id);

create index security_deposit_transactions_payment_idx
    on kiraya.security_deposit_transactions (payment_id);

comment on table kiraya.security_deposit_transactions is
    'Transaction history underlying the security deposit balance.';

comment on column kiraya.security_deposit_transactions.transaction_type is
    'Deposit transaction category: RECEIPT, DEDUCTION, REFUND or ADJUSTMENT.';

comment on column kiraya.security_deposit_transactions.amount is
    'Positive transaction amount. Direction is determined by transaction_type.';