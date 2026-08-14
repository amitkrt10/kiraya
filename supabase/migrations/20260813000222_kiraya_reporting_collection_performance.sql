-- ============================================================
-- KIRAYA
-- Migration: collection performance reporting
--
-- Purpose:
-- Provides monthly billed vs collected numbers.
-- ============================================================

create or replace view kiraya.v_collection_performance
with (security_invoker = true)
as
select
    b.organization_id,

    date_trunc(
        'month',
        b.bill_date
    )::date as collection_month,

    count(b.id) as bill_count,

    coalesce(
        sum(b.total_amount)
            filter (
                where b.status <> 'VOID'
            ),
        0
    ) as billed_amount,

    coalesce(
        sum(
            kiraya.get_bill_paid_amount(b.id)
        ) filter (
            where b.status <> 'VOID'
        ),
        0
    ) as collected_amount,

    coalesce(
        sum(
            kiraya.get_bill_balance(b.id)
        ) filter (
            where b.status <> 'VOID'
        ),
        0
    ) as outstanding_amount,

    round(
        case
            when coalesce(
                sum(b.total_amount)
                    filter (
                        where b.status <> 'VOID'
                    ),
                0
            ) = 0
            then 0

            else
                (
                    coalesce(
                        sum(
                            kiraya.get_bill_paid_amount(b.id)
                        ) filter (
                            where b.status <> 'VOID'
                        ),
                        0
                    )
                    /
                    sum(b.total_amount)
                        filter (
                            where b.status <> 'VOID'
                        )
                ) * 100
        end,
        2
    ) as collection_percentage

from kiraya.bills b

group by
    b.organization_id,
    date_trunc(
        'month',
        b.bill_date
    )::date;