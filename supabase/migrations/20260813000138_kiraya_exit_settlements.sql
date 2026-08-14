-- ============================================================
-- KIRAYA
-- Migration: exit_settlements
--
-- Purpose:
-- Final financial settlement for a tenant exit.
--
-- Conceptually:
--
-- Previous dues
-- + final rent
-- + utilities
-- + other charges
-- - security deposit
-- - credits
-- = final amount payable/refundable
--
-- The detailed components are stored in
-- exit_settlement_items.
-- ============================================================

create table kiraya.exit_settlements (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_exit_id uuid
        not null
        references kiraya.tenant_exits(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    settlement_reference text
        not null,

    settlement_date date
        not null,

    status kiraya.settlement_status
        not null default 'DRAFT',

    previous_dues numeric(18,2)
        not null default 0,

    final_charges numeric(18,2)
        not null default 0,

    deposit_deduction numeric(18,2)
        not null default 0,

    tenant_credit numeric(18,2)
        not null default 0,

    final_amount_due numeric(18,2)
        not null default 0,

    final_amount_refundable numeric(18,2)
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

    constraint exit_settlements_reference_check
        check (
            length(trim(settlement_reference)) > 0
        ),

    constraint exit_settlements_previous_dues_check
        check (previous_dues >= 0),

    constraint exit_settlements_final_charges_check
        check (final_charges >= 0),

    constraint exit_settlements_deposit_deduction_check
        check (deposit_deduction >= 0),

    constraint exit_settlements_tenant_credit_check
        check (tenant_credit >= 0),

    constraint exit_settlements_due_check
        check (final_amount_due >= 0),

    constraint exit_settlements_refundable_check
        check (final_amount_refundable >= 0),

    constraint exit_settlements_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint exit_settlements_finalization_check
        check (
            status = 'DRAFT'
            or finalized_at is not null
        ),

    constraint exit_settlements_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index exit_settlements_org_reference_unique_idx
    on kiraya.exit_settlements (
        organization_id,
        lower(trim(settlement_reference))
    );

-- One finalized/current settlement per exit.
create unique index exit_settlements_exit_unique_idx
    on kiraya.exit_settlements (tenant_exit_id);

create index exit_settlements_organization_idx
    on kiraya.exit_settlements (organization_id);

create index exit_settlements_lease_idx
    on kiraya.exit_settlements (lease_id);

create index exit_settlements_tenant_idx
    on kiraya.exit_settlements (tenant_id);

create index exit_settlements_status_idx
    on kiraya.exit_settlements (
        organization_id,
        status
    );

comment on table kiraya.exit_settlements is
    'Final financial settlement generated during tenant exit.';

comment on column kiraya.exit_settlements.previous_dues is
    'Outstanding tenant liability carried into the final settlement.';

comment on column kiraya.exit_settlements.final_charges is
    'New charges generated as part of the final settlement.';

comment on column kiraya.exit_settlements.deposit_deduction is
    'Security deposit amount applied against tenant liabilities.';

comment on column kiraya.exit_settlements.tenant_credit is
    'Existing tenant credit applied toward the final settlement.';

comment on column kiraya.exit_settlements.final_amount_due is
    'Net amount the tenant must pay after credits and deposit deductions.';

comment on column kiraya.exit_settlements.final_amount_refundable is
    'Net amount that should be returned to the tenant.';