-- ============================================================
-- KIRAYA
-- P3.6: owner portfolio reporting
--
-- IMPORTANT:
-- v_owner_portfolio already exists from migration 00210.
-- PostgreSQL CREATE OR REPLACE VIEW requires existing column
-- names/order to remain unchanged.
--
-- Existing columns 1-13 are therefore preserved exactly.
-- New calculated fields are appended after them.
-- ============================================================


create or replace view kiraya.v_owner_portfolio
with (security_invoker = true)
as
select
    po.organization_id,

    o.id as owner_id,
    o.owner_code,
    o.display_name as owner_name,

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

    coalesce(
        sum(
            case
                when l.status = 'ACTIVE'
                    then kiraya.get_tenant_due(
                        l.tenant_id
                    )
                else 0
            end
        ),
        0
    ) as tenant_dues,

    coalesce(
        sum(
            case
                when l.status = 'ACTIVE'
                    then kiraya.get_tenant_credit(
                        l.tenant_id
                    )
                else 0
            end
        ),
        0
    ) as tenant_credits,

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
    ) as occupancy_percentage,

    o.owner_type

from kiraya.property_ownerships po

join kiraya.owners o
    on o.id = po.owner_id

join kiraya.properties p
    on p.id = po.property_id

left join kiraya.units u
    on u.property_id = p.id

left join kiraya.leases l
    on l.unit_id = u.id
   and l.status = 'ACTIVE'

where p.status = 'ACTIVE'

group by
    po.organization_id,

    o.id,
    o.owner_code,
    o.display_name,

    p.id,
    p.property_code,
    p.name,

    po.ownership_percentage,

    o.owner_type;