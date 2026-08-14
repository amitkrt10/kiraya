-- ============================================================
-- KIRAYA
-- Migration: payment_methods
-- ============================================================

create table kiraya.payment_methods (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    code text
        not null,

    name text
        not null,

    method_type kiraya.payment_method_type
        not null,

    is_system boolean
        not null default false,

    is_active boolean
        not null default true,

    sort_order integer
        not null default 0,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint payment_methods_code_check
        check (length(trim(code)) > 0),

    constraint payment_methods_name_check
        check (length(trim(name)) > 0),

    constraint payment_methods_sort_order_check
        check (sort_order >= 0),

    constraint payment_methods_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create unique index payment_methods_org_code_unique_idx
    on kiraya.payment_methods (
        organization_id,
        lower(trim(code))
    );

create index payment_methods_organization_idx
    on kiraya.payment_methods (organization_id);

create index payment_methods_active_idx
    on kiraya.payment_methods (
        organization_id,
        is_active,
        sort_order
    );

comment on table kiraya.payment_methods is
    'Payment methods configured by each Kiraya organization.';

comment on column kiraya.payment_methods.method_type is
    'Broad category of the payment method.';

comment on column kiraya.payment_methods.is_system is
    'Indicates a default Kiraya-provided payment method.';

comment on column kiraya.payment_methods.metadata is
    'Additional payment-method configuration.';