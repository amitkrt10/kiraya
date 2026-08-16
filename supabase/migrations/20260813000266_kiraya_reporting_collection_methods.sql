-- ============================================================
-- KIRAYA
-- P3.12: collection by payment method
--
-- Designed for stacked monthly collection charts.
--
-- Default methods:
--   CASH
--   ONLINE
--   DISCOUNT
--   OTHER
-- ============================================================


create or replace view kiraya.v_collection_by_payment_method
with (security_invoker = true)
as
select
    p.organization_id,

    date_trunc(
        'month',
        p.payment_date
    )::date as period_month,

    pm.id as payment_method_id,
    pm.code as payment_method_code,
    pm.name as payment_method_name,

    count(p.id) as payment_count,

    coalesce(
        sum(p.amount),
        0
    ) as collected_amount

from kiraya.payments p

join kiraya.payment_methods pm
    on pm.id = p.payment_method_id

where p.status = 'POSTED'

group by
    p.organization_id,

    date_trunc(
        'month',
        p.payment_date
    )::date,

    pm.id,
    pm.code,
    pm.name;