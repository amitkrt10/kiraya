-- ============================================================
-- KIRAYA
-- P3.3: meter consumption trend
--
-- Consumption is based on consecutive readings for the same
-- meter.
--
-- A reset/replacement event starts a new reading sequence.
-- ============================================================


create or replace view kiraya.v_meter_consumption_trend
with (security_invoker = true)
as
with readings as (

    select
        mr.id as reading_id,

        mr.organization_id,
        mr.meter_id,

        m.meter_code,
        m.meter_type,
        m.unit_id,

        u.unit_code,
        u.name as unit_name,

        p.id as property_id,
        p.property_code,
        p.name as property_name,

        m.utility_id,
        ut.name as utility_name,

        mr.reading_date,
        mr.reading_value,
        mr.reading_event_type,

        lag(
            mr.reading_value
        ) over (
            partition by mr.meter_id
            order by
                mr.reading_date,
                mr.created_at,
                mr.id
        ) as previous_reading,

        lag(
            mr.reading_event_type
        ) over (
            partition by mr.meter_id
            order by
                mr.reading_date,
                mr.created_at,
                mr.id
        ) as previous_event_type,

        m.multiplier

    from kiraya.meter_readings mr

    join kiraya.meters m
        on m.id = mr.meter_id

    join kiraya.units u
        on u.id = m.unit_id

    join kiraya.properties p
        on p.id = u.property_id

    join kiraya.utilities ut
        on ut.id = m.utility_id
)

select
    reading_id,

    organization_id,
    meter_id,
    meter_code,
    meter_type,

    unit_id,
    unit_code,
    unit_name,

    property_id,
    property_code,
    property_name,

    utility_id,
    utility_name,

    reading_date,
    reading_value,

    previous_reading,

    case
        when previous_reading is null
            then null

        when reading_event_type in (
            'METER_RESET',
            'METER_REPLACEMENT'
        )
            then null

        when previous_event_type in (
            'METER_RESET',
            'METER_REPLACEMENT'
        )
            then null

        when reading_value < previous_reading
            then null

        else
            round(
                (
                    reading_value
                    - previous_reading
                ) * multiplier,
                6
            )
    end as consumption,

    reading_event_type

from readings;