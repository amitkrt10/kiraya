-- ============================================================
-- KIRAYA
-- Migration: meter_reading_batches
--
-- Purpose:
-- Represents a bulk meter-reading collection session.
--
-- This supports the workflow:
--
--   1. Client selects billing date.
--   2. Kiraya shows all applicable meters.
--   3. User enters readings.
--   4. User saves/submits the batch.
--   5. Billing engine uses the readings to generate bills.
--
-- Example:
--
-- August 1 Meter Reading Batch
--   ├── Flat 101 Electricity
--   ├── Flat 102 Electricity
--   ├── Flat 103 Electricity
--   └── Office 201 Electricity
-- ============================================================

create table kiraya.meter_reading_batches (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    property_id uuid
        references kiraya.properties(id)
        on delete restrict,

    reading_date date
        not null,

    batch_code text
        not null,

    status text
        not null default 'DRAFT',

    submitted_at timestamptz,

    submitted_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint meter_reading_batches_code_check
        check (
            length(trim(batch_code)) > 0
        ),

    constraint meter_reading_batches_status_check
        check (
            status in (
                'DRAFT',
                'SUBMITTED',
                'FINALIZED',
                'CANCELLED'
            )
        ),

    constraint meter_reading_batches_submission_check
        check (
            status = 'DRAFT'
            or submitted_at is not null
        ),

    constraint meter_reading_batches_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index meter_reading_batches_org_code_unique_idx
    on kiraya.meter_reading_batches (
        organization_id,
        lower(trim(batch_code))
    );

create index meter_reading_batches_organization_idx
    on kiraya.meter_reading_batches (organization_id);

create index meter_reading_batches_property_idx
    on kiraya.meter_reading_batches (property_id);

create index meter_reading_batches_date_idx
    on kiraya.meter_reading_batches (
        organization_id,
        reading_date
    );

create index meter_reading_batches_status_idx
    on kiraya.meter_reading_batches (
        organization_id,
        status
    );

comment on table kiraya.meter_reading_batches is
    'Bulk meter-reading collection session used for periodic billing.';

comment on column kiraya.meter_reading_batches.property_id is
    'Optional property scope for the reading batch. NULL means organization-wide.';

comment on column kiraya.meter_reading_batches.reading_date is
    'Date on which the readings in this batch were recorded.';

comment on column kiraya.meter_reading_batches.batch_code is
    'Unique identifier for the reading batch.';

comment on column kiraya.meter_reading_batches.status is
    'Lifecycle status of the reading collection batch.';