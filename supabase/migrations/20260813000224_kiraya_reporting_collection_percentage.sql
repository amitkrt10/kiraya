-- ============================================================
-- KIRAYA
-- Migration: payment method collection percentage
-- ============================================================

create or replace view kiraya.v_collection_by_payment_method
with (security_invoker = true)
as
with monthly_collections as (

    select
        p.organization_id,

        date_trunc(
            'month',
            p.payment_date
        )::date as collection_month,

        p.payment_method_id,

        sum(p.amount) as collected_amount

    from kiraya.payments p

    where p.status = 'POSTED'

    group by
        p.organization_id,
        date_trunc(
            'month',
            p.payment_date
        )::date,
        p.payment_method_id
)

select
    mc.organization_id,

    mc.collection_month,

    mc.payment_method_id,

    pm.code as payment_method_code,
    pm.name as payment_method_name,

    mc.collected_amount,

    sum(
        mc.collected_amount
    ) over (
        partition by
            mc.organization_id,
            mc.collection_month
    ) as total_monthly_collection,

    round(
        case
            when sum(
                mc.collected_amount
            ) over (
                partition by
                    mc.organization_id,
                    mc.collection_month
            ) = 0
            then 0

            else
                (
                    mc.collected_amount
                    /
                    sum(
                        mc.collected_amount
                    ) over (
                        partition by
                            mc.organization_id,
                            mc.collection_month
                    )
                ) * 100
        end,
        2
    ) as collection_percentage

from monthly_collections mc

join kiraya.payment_methods pm
    on pm.id = mc.payment_method_id;