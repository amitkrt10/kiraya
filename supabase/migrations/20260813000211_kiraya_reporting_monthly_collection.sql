-- ============================================================
-- KIRAYA
-- Migration: monthly collection reporting
-- ============================================================

create or replace view kiraya.v_monthly_collection
with (security_invoker = true)
as
select
    p.organization_id,

    date_trunc(
        'month',
        p.payment_date
    )::date as collection_month,

    count(*) as payment_count,

    sum(
        case
            when p.status = 'POSTED'
                then p.amount
            else 0
        end
    ) as total_collected,

    sum(
        case
            when p.status = 'REVERSED'
                then p.amount
            else 0
        end
    ) as reversed_amount,

    sum(
        case
            when p.status = 'POSTED'
                then 1
            else 0
        end
    ) as successful_payment_count

from kiraya.payments p

group by
    p.organization_id,
    date_trunc(
        'month',
        p.payment_date
    )::date;