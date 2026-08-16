-- ============================================================
-- KIRAYA
-- P3.4: tenant milestone reporting
--
-- Milestones:
--
--   11 months
--   22 months
--   33 months
--   44 months
--   ...
--
-- completed_months is the authoritative value.
-- ============================================================


create or replace view kiraya.v_tenant_milestones
with (security_invoker = true)
as
with lease_age as (

    select
        l.organization_id,

        l.id as lease_id,
        l.lease_code,

        t.id as tenant_id,
        t.tenant_code,
        t.display_name as tenant_name,
        t.phone,

        p.id as property_id,
        p.property_code,
        p.name as property_name,

        u.id as unit_id,
        u.unit_code,
        u.name as unit_name,

        l.occupancy_start_date,
        l.actual_end_date,

        (
            current_date
            - l.occupancy_start_date
        ) as occupancy_days,

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

    where l.status = 'ACTIVE'
)

select
    organization_id,

    lease_id,
    lease_code,

    tenant_id,
    tenant_code,
    tenant_name,
    phone,

    property_id,
    property_code,
    property_name,

    unit_id,
    unit_code,
    unit_name,

    occupancy_start_date,
    actual_end_date,

    occupancy_days,
    completed_months,

    (
        completed_months > 0
        and completed_months % 11 = 0
    ) as milestone_month,

    case
        when completed_months > 0
         and completed_months % 11 = 0
            then completed_months
        else null
    end as milestone_number

from lease_age;