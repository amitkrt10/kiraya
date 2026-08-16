-- ============================================================
-- KIRAYA
-- P3.13: organization dashboard
--
-- One row per organization per month.
--
-- The frontend can use this directly for KPI cards.
-- ============================================================


create or replace view kiraya.v_organization_dashboard
with (security_invoker = true)
as
with property_stats as (

    select
        p.organization_id,

        count(distinct p.id) as property_count,

        count(u.id) as unit_count,

        count(u.id) filter (
            where u.status = 'OCCUPIED'
        ) as occupied_unit_count,

        count(u.id) filter (
            where u.status = 'VACANT'
        ) as vacant_unit_count

    from kiraya.properties p

    left join kiraya.units u
        on u.property_id = p.id

    where p.status = 'ACTIVE'

    group by p.organization_id
),

tenant_stats as (

    select
        t.organization_id,

        count(*) filter (
            where t.status = 'ACTIVE'
        ) as active_tenant_count

    from kiraya.tenants t

    group by t.organization_id
),

bill_stats as (

    select
        b.organization_id,

        date_trunc(
            'month',
            b.bill_date
        )::date as period_month,

        coalesce(
            sum(
                case
                    when b.status <> 'VOID'
                        then b.total_amount
                    else 0
                end
            ),
            0
        ) as billed_amount

    from kiraya.bills b

    group by
        b.organization_id,
        date_trunc(
            'month',
            b.bill_date
        )::date
),

payment_stats as (

    select
        p.organization_id,

        date_trunc(
            'month',
            p.payment_date
        )::date as period_month,

        coalesce(
            sum(p.amount),
            0
        ) as collected_amount

    from kiraya.payments p

    where p.status = 'POSTED'

    group by
        p.organization_id,
        date_trunc(
            'month',
            p.payment_date
        )::date
),

dashboard_periods as (

    select
        organization_id,
        period_month
    from bill_stats

    union

    select
        organization_id,
        period_month
    from payment_stats
)

select
    dp.organization_id,

    dp.period_month,

    coalesce(
        ps.property_count,
        0
    ) as property_count,

    coalesce(
        ps.unit_count,
        0
    ) as unit_count,

    coalesce(
        ps.occupied_unit_count,
        0
    ) as occupied_unit_count,

    coalesce(
        ps.vacant_unit_count,
        0
    ) as vacant_unit_count,

    case
        when coalesce(
            ps.unit_count,
            0
        ) = 0
            then 0

        else round(
            (
                ps.occupied_unit_count::numeric
                /
                ps.unit_count
            ) * 100,
            2
        )
    end as occupancy_percentage,

    coalesce(
        ts.active_tenant_count,
        0
    ) as active_tenant_count,

    coalesce(
        bs.billed_amount,
        0
    ) as billed_amount,

    coalesce(
        pmt.collected_amount,
        0
    ) as collected_amount,

    greatest(
        0,
        coalesce(
            bs.billed_amount,
            0
        )
        -
        coalesce(
            pmt.collected_amount,
            0
        )
    ) as period_collection_gap,

    case
        when coalesce(
            bs.billed_amount,
            0
        ) = 0
            then 0

        else round(
            (
                coalesce(
                    pmt.collected_amount,
                    0
                )
                /
                bs.billed_amount
            ) * 100,
            2
        )
    end as collection_percentage,

    coalesce(
        (
            select sum(
                greatest(
                    0,
                    kiraya.get_tenant_due(t.id)
                )
            )
            from kiraya.tenants t
            where t.organization_id = dp.organization_id
              and t.status = 'ACTIVE'
        ),
        0
    ) as active_tenant_dues,

    coalesce(
        (
            select sum(
                greatest(
                    0,
                    kiraya.get_tenant_credit(t.id)
                )
            )
            from kiraya.tenants t
            where t.organization_id = dp.organization_id
              and t.status = 'ACTIVE'
        ),
        0
    ) as active_tenant_credits

from dashboard_periods dp

left join property_stats ps
    on ps.organization_id = dp.organization_id

left join tenant_stats ts
    on ts.organization_id = dp.organization_id

left join bill_stats bs
    on bs.organization_id = dp.organization_id
   and bs.period_month = dp.period_month

left join payment_stats pmt
    on pmt.organization_id = dp.organization_id
   and pmt.period_month = dp.period_month;