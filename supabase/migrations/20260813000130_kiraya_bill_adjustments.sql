-- ============================================================
-- KIRAYA
-- Migration: bill_adjustments
--
-- Purpose:
-- Records explicit adjustments made to a bill.
--
-- Examples:
--   Discount
--   Waiver
--   Manual increase
--   Manual decrease
--   Correction
--
-- Adjustments are separate from bill_items so the application
-- can clearly distinguish normal charges from manual changes.
-- ============================================================

create table kiraya.bill_adjustments (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    bill_id uuid
        not null
        references kiraya.bills(id)
        on delete cascade,

    adjustment_type text
        not null,

    description text
        not null,

    amount numeric(18,2)
        not null,

    reason text,

    created_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    created_at timestamptz
        not null default now(),

    metadata jsonb
        not null default '{}'::jsonb,

    constraint bill_adjustments_type_check
        check (
            length(trim(adjustment_type)) > 0
        ),

    constraint bill_adjustments_description_check
        check (
            length(trim(description)) > 0
        ),

    constraint bill_adjustments_amount_check
        check (
            amount <> 0
        ),

    constraint bill_adjustments_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index bill_adjustments_organization_idx
    on kiraya.bill_adjustments (organization_id);

create index bill_adjustments_bill_idx
    on kiraya.bill_adjustments (bill_id);

create index bill_adjustments_created_by_idx
    on kiraya.bill_adjustments (created_by);

comment on table kiraya.bill_adjustments is
    'Explicit manual or business-rule adjustments applied to bills.';

comment on column kiraya.bill_adjustments.adjustment_type is
    'Adjustment category such as DISCOUNT, WAIVER, INCREASE, DECREASE or CORRECTION.';

comment on column kiraya.bill_adjustments.amount is
    'Signed adjustment amount. Negative values reduce the bill; positive values increase it.';

comment on column kiraya.bill_adjustments.reason is
    'Human-readable explanation for the adjustment.';