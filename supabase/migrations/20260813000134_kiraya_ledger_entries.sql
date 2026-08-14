-- ============================================================
-- KIRAYA
-- Migration: ledger_entries
--
-- Purpose:
-- Authoritative financial ledger for tenant balances.
--
-- Debit:
--   Amount tenant owes.
--
-- Credit:
--   Amount tenant has paid / been credited.
--
-- Examples:
--
-- Bill ₹30,000
--   DEBIT  ₹30,000
--
-- Payment ₹20,000
--   CREDIT ₹20,000
--
-- Balance = ₹10,000 due
--
-- Overpayment:
--
-- Bill ₹30,000
-- Payment ₹35,000
--   DEBIT  ₹30,000
--   CREDIT ₹35,000
--
-- Balance = -₹5,000
-- Meaning tenant has ₹5,000 credit.
-- ============================================================

create table kiraya.ledger_entries (
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

    lease_id uuid
        references kiraya.leases(id)
        on delete restrict,

    bill_id uuid
        references kiraya.bills(id)
        on delete restrict,

    payment_id uuid
        references kiraya.payments(id)
        on delete restrict,

    payment_allocation_id uuid
        references kiraya.payment_allocations(id)
        on delete restrict,

    entry_type kiraya.ledger_entry_type
        not null,

    entry_date date
        not null,

    description text
        not null,

    debit_amount numeric(18,2)
        not null default 0,

    credit_amount numeric(18,2)
        not null default 0,

    currency_code text
        not null default 'INR',

    reference_code text,

    is_reversal boolean
        not null default false,

    reverses_entry_id uuid
        references kiraya.ledger_entries(id)
        on delete restrict,

    created_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    created_at timestamptz
        not null default now(),

    metadata jsonb
        not null default '{}'::jsonb,

    constraint ledger_entries_description_check
        check (length(trim(description)) > 0),

    constraint ledger_entries_debit_check
        check (debit_amount >= 0),

    constraint ledger_entries_credit_check
        check (credit_amount >= 0),

    constraint ledger_entries_one_side_check
        check (
            (
                debit_amount > 0
                and credit_amount = 0
            )
            or
            (
                credit_amount > 0
                and debit_amount = 0
            )
        ),

    constraint ledger_entries_currency_check
        check (currency_code ~ '^[A-Z]{3}$'),

    constraint ledger_entries_reversal_check
        check (
            (
                is_reversal = false
                and reverses_entry_id is null
            )
            or
            (
                is_reversal = true
                and reverses_entry_id is not null
            )
        ),

    constraint ledger_entries_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index ledger_entries_organization_idx
    on kiraya.ledger_entries (organization_id);

create index ledger_entries_tenant_date_idx
    on kiraya.ledger_entries (
        tenant_id,
        entry_date,
        created_at
    );

create index ledger_entries_lease_idx
    on kiraya.ledger_entries (lease_id);

create index ledger_entries_bill_idx
    on kiraya.ledger_entries (bill_id);

create index ledger_entries_payment_idx
    on kiraya.ledger_entries (payment_id);

create index ledger_entries_payment_allocation_idx
    on kiraya.ledger_entries (payment_allocation_id);

create index ledger_entries_reversal_idx
    on kiraya.ledger_entries (reverses_entry_id)
    where reverses_entry_id is not null;

comment on table kiraya.ledger_entries is
    'Authoritative tenant financial ledger.';

comment on column kiraya.ledger_entries.debit_amount is
    'Amount increasing the tenant liability.';

comment on column kiraya.ledger_entries.credit_amount is
    'Amount reducing the tenant liability or creating tenant credit.';

comment on column kiraya.ledger_entries.is_reversal is
    'Indicates that this entry reverses a previous ledger entry.';

comment on column kiraya.ledger_entries.reverses_entry_id is
    'Original ledger entry being reversed.';