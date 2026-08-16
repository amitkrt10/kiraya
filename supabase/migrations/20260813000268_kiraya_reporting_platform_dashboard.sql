-- ============================================================
-- KIRAYA
-- P3.14: platform / super-admin dashboard
--
-- This view intentionally does NOT expose tenant-level
-- financial detail.
--
-- It provides portfolio-level KPIs across organizations.
-- RLS/helper access will determine who can see the rows.
-- ============================================================


create or replace view kiraya.v_platform_dashboard
with (security_invoker = true)
as
select
    d.period_month,

    count(
        distinct d.organization_id
    ) as organization_count,

    sum(
        d.property_count
    ) as property_count,

    sum(
        d.unit_count
    ) as unit_count,

    sum(
        d.occupied_unit_count
    ) as occupied_unit_count,

    sum(
        d.vacant_unit_count
    ) as vacant_unit_count,

    sum(
        d.active_tenant_count
    ) as active_tenant_count,

    sum(
        d.billed_amount
    ) as billed_amount,

    sum(
        d.collected_amount
    ) as collected_amount,

    sum(
        d.active_tenant_dues
    ) as active_tenant_dues,

    sum(
        d.active_tenant_credits
    ) as active_tenant_credits,

    case
        when sum(
            d.billed_amount
        ) = 0
            then 0

        else round(
            (
                sum(
                    d.collected_amount
                )
                /
                sum(
                    d.billed_amount
                )
            ) * 100,
            2
        )
    end as collection_percentage,

    case
        when sum(
            d.unit_count
        ) = 0
            then 0

        else round(
            (
                sum(
                    d.occupied_unit_count
                )::numeric
                /
                sum(
                    d.unit_count
                )
            ) * 100,
            2
        )
    end as occupancy_percentage

from kiraya.v_organization_dashboard d

group by
    d.period_month;