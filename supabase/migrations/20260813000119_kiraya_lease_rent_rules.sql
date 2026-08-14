-- ============================================================
-- KIRAYA
-- Migration: lease_rent_rules
--
-- Purpose:
-- Stores rent rules for a lease.
--
-- Supports future scheduled rent increases.
--
-- IMPORTANT:
-- Future rent rules are NOT automatically applied.
-- A rule becomes effective only according to its configured
-- effective period/status and the billing engine.
--
-- Historical rules remain preserved.
-- ============================================================

create table kiraya.lease_rent_rules (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete cascade,

    rule_name text
        not null,

    monthly_rent numeric(18,2)
        not null,

    effective_from date
        not null,

    effective_to date,

    is_active boolean
        not null default true,

    auto_apply boolean
        not null default false,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint lease_rent_rules_name_check
        check (
            length(trim(rule_name)) > 0
        ),

    constraint lease_rent_rules_rent_check
        check (
            monthly_rent >= 0
        ),

    constraint lease_rent_rules_date_check
        check (
            effective_to is null
            or effective_to >= effective_from
        ),

    constraint lease_rent_rules_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index lease_rent_rules_organization_idx
    on kiraya.lease_rent_rules (organization_id);

create index lease_rent_rules_lease_idx
    on kiraya.lease_rent_rules (
        lease_id,
        effective_from
    );

create index lease_rent_rules_active_idx
    on kiraya.lease_rent_rules (
        lease_id,
        is_active,
        effective_from
    );

comment on table kiraya.lease_rent_rules is
    'Historical and scheduled rent rules for a lease.';

comment on column kiraya.lease_rent_rules.monthly_rent is
    'Monthly base rent applicable during this rule period.';

comment on column kiraya.lease_rent_rules.effective_from is
    'Date from which this rent rule may apply.';

comment on column kiraya.lease_rent_rules.effective_to is
    'Optional final date for this rent rule.';

comment on column kiraya.lease_rent_rules.auto_apply is
    'Reserved for future automation. Defaults to false because Kiraya must not automatically change rent without user confirmation.';

comment on column kiraya.lease_rent_rules.metadata is
    'Additional rent-rule information.';