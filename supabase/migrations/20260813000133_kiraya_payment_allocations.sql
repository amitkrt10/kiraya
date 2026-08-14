-- ============================================================
-- KIRAYA
-- Migration: payment_allocations
--
-- Purpose:
-- Connects payments to bills.
--
-- Example:
--
-- Bill       = ₹30,000
-- Payment    = ₹35,000
--
-- Allocation = ₹30,000
-- Unallocated credit = ₹5,000
--
-- The ₹5,000 remains available for future bills.
--
-- Underpayment:
--
-- Bill       = ₹30,000
-- Payment    = ₹20,000
--
-- Allocation = ₹20,000
-- Outstanding = ₹10,000
-- ============================================================

create table kiraya.payment_allocations (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    payment_id uuid
        not null
        references kiraya.payments(id)
        on delete restrict,

    bill_id uuid
        not null
        references kiraya.bills(id)
        on delete restrict,

    allocated_amount numeric(18,2)
        not null,

    allocation_date date
        not null default current_date,

    notes text,

    created_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    created_at timestamptz
        not null default now(),

    metadata jsonb
        not null default '{}'::jsonb,

    constraint payment_allocations_amount_check
        check (allocated_amount > 0),

    constraint payment_allocations_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index payment_allocations_organization_idx
    on kiraya.payment_allocations (organization_id);

create index payment_allocations_payment_idx
    on kiraya.payment_allocations (payment_id);

create index payment_allocations_bill_idx
    on kiraya.payment_allocations (bill_id);

create index payment_allocations_date_idx
    on kiraya.payment_allocations (
        organization_id,
        allocation_date
    );

comment on table kiraya.payment_allocations is
    'Allocations connecting received payments to individual bills.';

comment on column kiraya.payment_allocations.allocated_amount is
    'Amount of the payment applied to the referenced bill.';