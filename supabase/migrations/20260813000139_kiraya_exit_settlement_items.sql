-- ============================================================
-- KIRAYA
-- Migration: exit_settlement_items
--
-- Purpose:
-- Detailed components of a tenant exit settlement.
--
-- Examples:
--   PREVIOUS_DUE
--   FINAL_RENT
--   ELECTRICITY
--   WATER
--   MAINTENANCE
--   DAMAGE
--   CLEANING
--   DEPOSIT_DEDUCTION
--   CREDIT
--   OTHER
-- ============================================================

create table kiraya.exit_settlement_items (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    exit_settlement_id uuid
        not null
        references kiraya.exit_settlements(id)
        on delete cascade,

    item_type text
        not null,

    description text
        not null,

    amount numeric(18,2)
        not null,

    is_credit boolean
        not null default false,

    source_bill_id uuid
        references kiraya.bills(id)
        on delete restrict,

    source_ledger_entry_id uuid
        references kiraya.ledger_entries(id)
        on delete restrict,

    sort_order integer
        not null default 0,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    constraint exit_settlement_items_type_check
        check (
            length(trim(item_type)) > 0
        ),

    constraint exit_settlement_items_description_check
        check (
            length(trim(description)) > 0
        ),

    constraint exit_settlement_items_amount_check
        check (
            amount >= 0
        ),

    constraint exit_settlement_items_sort_check
        check (
            sort_order >= 0
        ),

    constraint exit_settlement_items_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index exit_settlement_items_organization_idx
    on kiraya.exit_settlement_items (organization_id);

create index exit_settlement_items_settlement_idx
    on kiraya.exit_settlement_items (
        exit_settlement_id,
        sort_order
    );

create index exit_settlement_items_bill_idx
    on kiraya.exit_settlement_items (source_bill_id);

create index exit_settlement_items_ledger_idx
    on kiraya.exit_settlement_items (source_ledger_entry_id);

comment on table kiraya.exit_settlement_items is
    'Detailed financial components of a tenant exit settlement.';

comment on column kiraya.exit_settlement_items.is_credit is
    'Indicates that the item reduces the tenant liability rather than increasing it.';

comment on column kiraya.exit_settlement_items.source_bill_id is
    'Optional bill from which this settlement item originated.';

comment on column kiraya.exit_settlement_items.source_ledger_entry_id is
    'Optional ledger entry from which this settlement item originated.';