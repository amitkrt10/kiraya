-- ============================================================
-- KIRAYA
-- Migration: units
--
-- Purpose:
-- Represents a rentable/managed unit inside a property.
--
-- Examples:
--   Flat 101
--   Office 204
--   Warehouse A
--   Shop 12
--   Land Parcel 4
--
-- A unit belongs to exactly one property.
-- A property can contain many units.
-- ============================================================

create table kiraya.units (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    property_id uuid
        not null
        references kiraya.properties(id)
        on delete restrict,

    unit_type_id uuid
        references kiraya.unit_types(id)
        on delete restrict,

    unit_code text
        not null,

    name text,

    description text,

    status kiraya.unit_status
        not null default 'VACANT',

    floor_number integer,

    area numeric(18,4),

    area_unit text,

    bedrooms numeric(4,1),

    bathrooms numeric(4,1),

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint units_code_check
        check (length(trim(unit_code)) > 0),

    constraint units_name_check
        check (
            name is null
            or length(trim(name)) > 0
        ),

    constraint units_area_check
        check (
            area is null
            or area >= 0
        ),

    constraint units_bedrooms_check
        check (
            bedrooms is null
            or bedrooms >= 0
        ),

    constraint units_bathrooms_check
        check (
            bathrooms is null
            or bathrooms >= 0
        ),

    constraint units_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

-- Unit code must be unique within a property.
create unique index units_property_code_unique_idx
    on kiraya.units (
        property_id,
        lower(trim(unit_code))
    );

create index units_organization_idx
    on kiraya.units (organization_id);

create index units_property_idx
    on kiraya.units (property_id);

create index units_type_idx
    on kiraya.units (unit_type_id);

create index units_status_idx
    on kiraya.units (
        organization_id,
        status
    );

comment on table kiraya.units is
    'Rentable or managed units belonging to properties.';

comment on column kiraya.units.organization_id is
    'Organization responsible for managing this unit.';

comment on column kiraya.units.property_id is
    'Property containing this unit.';

comment on column kiraya.units.unit_code is
    'Identifier of the unit within its property, e.g. Flat-101.';

comment on column kiraya.units.status is
    'Current operational/occupancy status of the unit.';

comment on column kiraya.units.area is
    'Optional physical area of the unit.';

comment on column kiraya.units.area_unit is
    'Unit used for area, e.g. sq_ft or sq_m.';

comment on column kiraya.units.bedrooms is
    'Number of bedrooms where applicable.';

comment on column kiraya.units.bathrooms is
    'Number of bathrooms where applicable.';

comment on column kiraya.units.metadata is
    'Additional organization-specific unit metadata.';