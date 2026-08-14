-- ============================================================
-- KIRAYA
-- Migration: tenant milestone reporting
-- ============================================================

create or replace view kiraya.v_tenant_milestones
with (security_invoker = true)
as
select
    l.organization_id,

    l.id as lease_id,
    l.lease_number,

    t.id as tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,
    t.phone_number,

    p.id as property_id,
    p.name as property_name,

    u.id as unit_id,
    u.unit_number,
    u.unit_name,

    l.occupancy_start_date,
    l.actual_end_date,

    (
        current_date - l.occupancy_start_date
    ) as occupancy_days,

    floor(
        (
            current_date - l.occupancy_start_date
        ) / 30.4375
    )::integer as approximate_months_completed,

    case
        when extract(
            month from age(
                current_date,
                l.occupancy_start_date
            )
        ) in (11, 22, 33, 44, 55)
        then true
        else false
    end as milestone_month,

    (
        extract(
            year from age(
                current_date,
                l.occupancy_start_date
            )
        ) * 12
        +
        extract(
            month from age(
                current_date,
                l.occupancy_start_date
            )
        )
    )::integer as completed_months

from kiraya.leases l

join kiraya.tenants t
    on t.id = l.tenant_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id

where l.status = 'ACTIVE';