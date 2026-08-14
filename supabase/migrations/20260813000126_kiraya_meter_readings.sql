-- ============================================================
-- KIRAYA
-- Migration: meter_readings
--
-- Purpose:
-- Stores individual meter readings.
--
-- A reading belongs to:
--   - one meter
--   - optionally one bulk reading batch
--
-- Consumption is calculated from the current and previous
-- applicable reading by the billing engine.
-- ============================================================

create table kiraya.meter_readings (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    meter_id uuid
        not null
        references kiraya.meters(id)
        on delete restrict,

    reading_batch_id uuid
        references kiraya.meter_reading_batches(id)
        on delete restrict,

    reading_date date
        not null,

    reading_value numeric(18,6)
        not null,

    reading_event_type kiraya.reading_event_type
        not null default 'NORMAL',

    reading_source kiraya.reading_source
        not null default 'MANUAL',

    image_document_id uuid,

    entered_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint meter_readings_value_check
        check (reading_value >= 0),

    constraint meter_readings_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

-- A meter should normally have only one reading for a date.
create unique index meter_readings_meter_date_unique_idx
    on kiraya.meter_readings (
        meter_id,
        reading_date
    );

create index meter_readings_organization_idx
    on kiraya.meter_readings (organization_id);

create index meter_readings_meter_date_idx
    on kiraya.meter_readings (
        meter_id,
        reading_date desc
    );

create index meter_readings_batch_idx
    on kiraya.meter_readings (reading_batch_id);

create index meter_readings_entered_by_idx
    on kiraya.meter_readings (entered_by);

comment on table kiraya.meter_readings is
    'Historical meter readings used to calculate utility consumption.';

comment on column kiraya.meter_readings.reading_value is
    'Raw meter reading recorded at reading_date.';

comment on column kiraya.meter_readings.reading_event_type is
    'Normal reading, meter reset, or meter replacement event.';

comment on column kiraya.meter_readings.reading_source is
    'Origin of the reading: manual, import, API, or other.';

comment on column kiraya.meter_readings.image_document_id is
    'Optional reference to a meter-reading photograph/document.';