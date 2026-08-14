-- ============================================================
-- KIRAYA
-- Migration: bill_items
--
-- Purpose:
-- Individual charge/credit lines belonging to a bill.
--
-- Examples:
--   Rent
--   Electricity
--   Water
--   Maintenance
--   Discount
--   Previous Due
--
-- Historical values such as quantity, unit rate and amount
-- are stored directly here so later configuration changes
-- cannot alter finalized bills.
-- ============================================================

create table kiraya.bill_items (
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

    item_type text
        not null,

    description text
        not null,

    utility_id uuid
        references kiraya.utilities(id)
        on delete restrict,

    meter_id uuid
        references kiraya.meters(id)
        on delete restrict,

    quantity numeric(18,6),

    unit_name text,

    unit_rate numeric(18,6),

    amount numeric(18,2)
        not null,

    tax_amount numeric(18,2)
        not null default 0,

    discount_amount numeric(18,2)
        not null default 0,

    sort_order integer
        not null default 0,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint bill_items_type_check
        check (
            length(trim(item_type)) > 0
        ),

    constraint bill_items_description_check
        check (
            length(trim(description)) > 0
        ),

    constraint bill_items_quantity_check
        check (
            quantity is null
            or quantity >= 0
        ),

    constraint bill_items_unit_rate_check
        check (
            unit_rate is null
            or unit_rate >= 0
        ),

    constraint bill_items_amount_check
        check (
            amount >= 0
        ),

    constraint bill_items_tax_check
        check (
            tax_amount >= 0
        ),

    constraint bill_items_discount_check
        check (
            discount_amount >= 0
        ),

    constraint bill_items_sort_order_check
        check (
            sort_order >= 0
        ),

    constraint bill_items_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index bill_items_organization_idx
    on kiraya.bill_items (organization_id);

create index bill_items_bill_idx
    on kiraya.bill_items (
        bill_id,
        sort_order
    );

create index bill_items_utility_idx
    on kiraya.bill_items (utility_id);

create index bill_items_meter_idx
    on kiraya.bill_items (meter_id);

comment on table kiraya.bill_items is
    'Individual financial charge lines belonging to a bill.';

comment on column kiraya.bill_items.item_type is
    'Flexible bill item category such as RENT, ELECTRICITY, WATER, MAINTENANCE, DISCOUNT or OTHER.';

comment on column kiraya.bill_items.quantity is
    'Quantity used for calculating the line, such as consumed electricity units.';

comment on column kiraya.bill_items.unit_rate is
    'Historical unit rate used when the line was generated.';

comment on column kiraya.bill_items.amount is
    'Historical monetary amount of the line.';

comment on column kiraya.bill_items.metadata is
    'Historical calculation inputs and additional line information.';