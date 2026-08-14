-- ============================================================
-- KIRAYA
-- Migration: meter consumption reporting
-- ============================================================

create or replace view kiraya.v_meter_consumption_trend
with (security_invoker = true)
as
select
    mr.organization_id,

    mr.meter_id,

    m.meter_number,
    m.unit_id,

    u.unit_number,
    u.unit_name,

    p.id as property_id,
    p.name as property_name,

    m.utility_id,
    ut.name as utility_name,

    mr.reading_date,
    mr.reading_value,

    lag(
        mr.reading_value
    ) over (
        partition by mr.meter_id
        order by
            mr.reading_date,
            mr.created_at
    ) as previous_reading,

    greatest(
        0,
        mr.reading_value
        -
        lag(
            mr.reading_value
        ) over (
            partition by mr.meter_id
            order by
                mr.reading_date,
                mr.created_at
        )
    ) * m.multiplier as consumption

from kiraya.meter_readings mr

join kiraya.meters m
    on m.id = mr.meter_id

join kiraya.units u
    on u.id = m.unit_id

join kiraya.properties p
    on p.id = u.property_id

join kiraya.utilities ut
    on ut.id = m.utility_id;