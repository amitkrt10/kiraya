-- ============================================================
-- KIRAYA
-- Migration: property_ownerships
--
-- Purpose:
-- Connects owners to properties and stores ownership
-- percentages.
--
-- Example:
--
-- Property A
--   Owner A -> 60%
--   Owner B -> 40%
--
-- The same owner can appear on many properties.
--
-- IMPORTANT:
-- The final 100% ownership validation will be enforced by
-- a database function/trigger in a later migration.
-- ============================================================

create table kiraya.property_ownerships (
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

    owner_id uuid
        not null
        references kiraya.owners(id)
        on delete restrict,

    ownership_percentage numeric(7,4)
        not null,

    ownership_start_date date,

    ownership_end_date date,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint property_ownerships_percentage_check
        check (
            ownership_percentage > 0
            and ownership_percentage <= 100
        ),

    constraint property_ownerships_date_range_check
        check (
            ownership_end_date is null
            or ownership_start_date is null
            or ownership_end_date >= ownership_start_date
        ),

    constraint property_ownerships_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

-- Prevent duplicate ownership records for the same
-- owner/property/start date combination.
create unique index property_ownerships_unique_idx
    on kiraya.property_ownerships (
        property_id,
        owner_id,
        coalesce(ownership_start_date, date '1900-01-01')
    );

create index property_ownerships_organization_idx
    on kiraya.property_ownerships (organization_id);

create index property_ownerships_property_idx
    on kiraya.property_ownerships (property_id);

create index property_ownerships_owner_idx
    on kiraya.property_ownerships (owner_id);

comment on table kiraya.property_ownerships is
    'Ownership interests connecting properties to their owners.';

comment on column kiraya.property_ownerships.organization_id is
    'Organization managing this ownership relationship.';

comment on column kiraya.property_ownerships.property_id is
    'Property in which the ownership interest exists.';

comment on column kiraya.property_ownerships.owner_id is
    'Owner holding the ownership interest.';

comment on column kiraya.property_ownerships.ownership_percentage is
    'Ownership percentage represented by this record.';

comment on column kiraya.property_ownerships.ownership_start_date is
    'Date from which this ownership interest applies.';

comment on column kiraya.property_ownerships.ownership_end_date is
    'Optional date through which this ownership interest applies.';

comment on column kiraya.property_ownerships.metadata is
    'Additional ownership-specific information.';