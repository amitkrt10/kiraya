-- ============================================================
-- KIRAYA
-- P3.2: property occupancy reporting
-- ============================================================


create or replace view kiraya.v_property_occupancy
with (security_invoker = true)
as
select
    p.organization_id,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    count(u.id) as total_units,

    count(u.id) filter (
        where u.status = 'OCCUPIED'
    ) as occupied_units,

    count(u.id) filter (
        where u.status = 'VACANT'
    ) as vacant_units,

    count(u.id) filter (
        where u.status = 'MAINTENANCE'
    ) as maintenance_units,

    count(u.id) filter (
        where u.status = 'UNAVAILABLE'
    ) as unavailable_units,

    round(
        (
            count(u.id) filter (
                where u.status = 'OCCUPIED'
            )::numeric
            /
            nullif(
                count(u.id),
                0
            )
        ) * 100,
        2
    ) as occupancy_percentage

from kiraya.properties p

left join kiraya.units u
    on u.property_id = p.id

where p.status = 'ACTIVE'

group by
    p.organization_id,
    p.id,
    p.property_code,
    p.name;