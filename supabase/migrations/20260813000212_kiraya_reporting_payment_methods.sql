-- ============================================================
-- KIRAYA
-- Migration: payment method reporting
-- ============================================================

create or replace view kiraya.v_payment_method_collection
with (security_invoker = true)
as
select
    p.organization_id,

    date_trunc(
        'month',
        p.payment_date
    )::date as collection_month,

    pm.id as payment_method_id,
    pm.code as payment_method_code,
    pm.name as payment_method_name,

    count(*) as payment_count,

    coalesce(
        sum(
            case
                when p.status = 'POSTED'
                    then p.amount
                else 0
            end
        ),
        0
    ) as collected_amount

from kiraya.payments p

join kiraya.payment_methods pm
    on pm.id = p.payment_method_id

group by
    p.organization_id,
    date_trunc(
        'month',
        p.payment_date
    )::date,
    pm.id,
    pm.code,
    pm.name;