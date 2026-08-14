-- ============================================================
-- KIRAYA
-- Migration: tenants
--
-- Purpose:
-- Master record for tenants.
--
-- A tenant can have multiple leases over time.
--
-- Tenant login credentials are managed separately through
-- Supabase Auth and linked using kiraya.tenant_user_links.
-- ============================================================

create table kiraya.tenants (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_type kiraya.tenant_type
        not null default 'INDIVIDUAL',

    tenant_code text
        not null,

    display_name text
        not null,

    legal_name text,

    phone text,

    alternate_phone text,

    email text,

    tax_identifier text,

    date_of_birth date,

    company_registration_number text,

    address_line_1 text,

    address_line_2 text,

    locality text,

    city text,

    state text,

    postal_code text,

    country_code text
        not null default 'IN',

    emergency_contact_name text,

    emergency_contact_phone text,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    status kiraya.tenant_status
        not null default 'ACTIVE',

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint tenants_code_check
        check (
            length(trim(tenant_code)) > 0
        ),

    constraint tenants_display_name_check
        check (
            length(trim(display_name)) > 0
        ),

    constraint tenants_country_check
        check (
            country_code ~ '^[A-Z]{2}$'
        ),

    constraint tenants_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index tenants_org_code_unique_idx
    on kiraya.tenants (
        organization_id,
        lower(trim(tenant_code))
    );

create index tenants_organization_idx
    on kiraya.tenants (organization_id);

create index tenants_status_idx
    on kiraya.tenants (
        organization_id,
        status
    );

create index tenants_display_name_idx
    on kiraya.tenants (
        organization_id,
        lower(display_name)
    );

create index tenants_phone_idx
    on kiraya.tenants (phone);

create index tenants_email_idx
    on kiraya.tenants (lower(email))
    where email is not null;

comment on table kiraya.tenants is
    'Tenant master records. A tenant can have multiple leases over time.';

comment on column kiraya.tenants.organization_id is
    'Organization managing this tenant record.';

comment on column kiraya.tenants.tenant_code is
    'Unique tenant identifier within the organization.';

comment on column kiraya.tenants.display_name is
    'Name displayed throughout the application.';

comment on column kiraya.tenants.phone is
    'Primary tenant contact number. This may also be used when provisioning a tenant login.';

comment on column kiraya.tenants.tax_identifier is
    'Optional tax identifier such as PAN or company tax number.';

comment on column kiraya.tenants.company_registration_number is
    'Optional company registration identifier for business tenants.';

comment on column kiraya.tenants.metadata is
    'Additional organization-specific tenant information.';