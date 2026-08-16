-- ============================================================
-- KIRAYA
-- P3.11: collection performance
--
-- IMPORTANT:
--
-- Collection % measures actual posted money/credits received
-- during the selected billing period against finalized bills
-- for that period.
--
-- It does NOT use payment allocations because allocations can
-- settle bills from another period.
-- ============================================================


create or replace view kiraya.v_collection_performance
with (security_invoker = true)
as
with monthly_bills as (

    select
        b.organization_id,

        date_trunc(
            'month',
            b.bill_date
        )::date as period_month,

        count(*) as bill_count,

        coalesce(
            sum(b.total_amount),
            0
        ) as billed_amount

    from kiraya.bills b

    where b.status in (
        'FINALIZED',
        'PARTIALLY_PAID',
        'PAID'
    )

    group by
        b.organization_id,
        date_trunc(
            'month',
            b.bill_date
        )::date
),

monthly_payments as (

    select
        p.organization_id,

        date_trunc(
            'month',
            p.payment_date
        )::date as period_month,

        count(*) as payment_count,

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
)

select
    coalesce(
        b.organization_id,
        p.organization_id
    ) as organization_id,

    coalesce(
        b.period_month,
        p.period_month
    ) as period_month,

    coalesce(
        b.bill_count,
        0
    ) as bill_count,

    coalesce(
        b.billed_amount,
        0
    ) as billed_amount,

    coalesce(
        p.payment_count,
        0
    ) as payment_count,

    coalesce(
        p.collected_amount,
        0
    ) as collected_amount,

    greatest(
        0,
        coalesce(
            b.billed_amount,
            0
        )
        -
        coalesce(
            p.collected_amount,
            0
        )
    ) as collection_gap,

    case
        when coalesce(
            b.billed_amount,
            0
        ) = 0
            then 0

        else round(
            (
                coalesce(
                    p.collected_amount,
                    0
                )
                /
                b.billed_amount
            ) * 100,
            2
        )
    end as collection_percentage

from monthly_bills b

full outer join monthly_payments p
    on p.organization_id = b.organization_id
   and p.period_month = b.period_month;