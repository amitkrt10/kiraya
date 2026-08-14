-- ============================================================
-- KIRAYA
-- Migration: owners
--
-- Purpose:
-- Master record for property owners.
--
-- An owner can own/manage interests in multiple properties.
-- The same owner must NOT be duplicated for every property.
--
-- Ownership percentages are stored separately in
-- kiraya.property_ownerships.
-- ============================================================

create table kiraya.owners (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    owner_type kiraya.owner_type
        not null default 'INDIVIDUAL',

    owner_code text
        not null,

    display_name text
        not null,

    legal_name text,

    phone text,

    email text,

    tax_identifier text,

    address_line_1 text,

    address_line_2 text,

    locality text,

    city text,

    state text,

    postal_code text,

    country_code text
        not null default 'IN',

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint owners_code_check
        check (
            length(trim(owner_code)) > 0
        ),

    constraint owners_display_name_check
        check (
            length(trim(display_name)) > 0
        ),

    constraint owners_country_check
        check (
            country_code ~ '^[A-Z]{2}$'
        ),

    constraint owners_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index owners_org_code_unique_idx
    on kiraya.owners (
        organization_id,
        lower(trim(owner_code))
    );

create index owners_organization_idx
    on kiraya.owners (organization_id);

create index owners_display_name_idx
    on kiraya.owners (
        organization_id,
        lower(display_name)
    );

create index owners_phone_idx
    on kiraya.owners (phone);

comment on table kiraya.owners is
    'Property owner master records maintained by an organization.';

comment on column kiraya.owners.organization_id is
    'Organization managing this owner record.';

comment on column kiraya.owners.owner_code is
    'Unique owner identifier within the organization.';

comment on column kiraya.owners.display_name is
    'Name displayed throughout the Kiraya application.';

comment on column kiraya.owners.legal_name is
    'Legal/registered name where different from display name.';

comment on column kiraya.owners.tax_identifier is
    'Optional tax identifier such as PAN or company tax number.';

comment on column kiraya.owners.metadata is
    'Additional organization-specific owner information.';