-- ============================================================
-- KIRAYA
-- Migration: properties
--
-- Purpose:
-- Represents a physical property managed by an organization.
--
-- A property can contain multiple units:
--   Flat
--   Office
--   Warehouse
--   Shop
--   Land
--   etc.
--
-- Ownership is intentionally stored separately in
-- property_ownerships because a client may manage property
-- owned by other people.
-- ============================================================

create table kiraya.properties (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    property_type_id uuid
        references kiraya.property_types(id)
        on delete restrict,

    property_code text
        not null,

    name text
        not null,

    description text,

    status kiraya.property_status
        not null default 'ACTIVE',

    address_line_1 text,

    address_line_2 text,

    locality text,

    city text,

    state text,

    postal_code text,

    country_code text
        not null default 'IN',

    latitude numeric(10,7),

    longitude numeric(10,7),

    total_area numeric(18,4),

    area_unit text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint properties_code_check
        check (length(trim(property_code)) > 0),

    constraint properties_name_check
        check (length(trim(name)) > 0),

    constraint properties_country_check
        check (country_code ~ '^[A-Z]{2}$'),

    constraint properties_latitude_check
        check (
            latitude is null
            or latitude between -90 and 90
        ),

    constraint properties_longitude_check
        check (
            longitude is null
            or longitude between -180 and 180
        ),

    constraint properties_total_area_check
        check (
            total_area is null
            or total_area >= 0
        ),

    constraint properties_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index properties_org_code_unique_idx
    on kiraya.properties (
        organization_id,
        lower(trim(property_code))
    );

create index properties_organization_idx
    on kiraya.properties (organization_id);

create index properties_type_idx
    on kiraya.properties (property_type_id);

create index properties_status_idx
    on kiraya.properties (
        organization_id,
        status
    );

comment on table kiraya.properties is
    'Physical properties managed by Kiraya organizations.';

comment on column kiraya.properties.organization_id is
    'Organization responsible for managing this property.';

comment on column kiraya.properties.property_code is
    'Unique property identifier within an organization.';

comment on column kiraya.properties.total_area is
    'Optional total physical area of the property.';

comment on column kiraya.properties.area_unit is
    'Unit used for total_area, e.g. sq_ft, sq_m, acre.';

comment on column kiraya.properties.metadata is
    'Additional organization-specific property metadata.';