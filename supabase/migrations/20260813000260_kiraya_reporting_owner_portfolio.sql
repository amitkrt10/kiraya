-- ============================================================
-- KIRAYA
-- P3.6: owner portfolio reporting
--
-- Shows:
--   owner
--   property
--   ownership %
--   units
--   occupancy
--   current rent
-- ============================================================


create or replace view kiraya.v_owner_portfolio
with (security_invoker = true)
as
select
    o.organization_id,

    o.id as owner_id,
    o.owner_code,
    o.display_name as owner_name,
    o.owner_type,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    po.ownership_percentage,

    count(u.id) as total_units,

    count(u.id) filter (
        where u.status = 'OCCUPIED'
    ) as occupied_units,

    count(u.id) filter (
        where u.status = 'VACANT'
    ) as vacant_units,

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

from kiraya.owners o

join kiraya.property_ownerships po
    on po.owner_id = o.id

join kiraya.properties p
    on p.id = po.property_id

left join kiraya.units u
    on u.property_id = p.id

where o.status = 'ACTIVE'
  and p.status = 'ACTIVE'

group by
    o.organization_id,
    o.id,
    o.owner_code,
    o.display_name,
    o.owner_type,
    p.id,
    p.property_code,
    p.name,
    po.ownership_percentage;