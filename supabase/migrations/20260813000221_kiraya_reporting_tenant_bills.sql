-- ============================================================
-- KIRAYA
-- Migration: tenant bill reporting
-- ============================================================

create or replace view kiraya.v_tenant_bill_summary
with (security_invoker = true)
as
select
    b.organization_id,

    b.id as bill_id,
    b.bill_number,

    b.tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,

    b.lease_id,
    l.lease_number,

    b.unit_id,
    u.unit_number,

    p.id as property_id,
    p.name as property_name,

    b.period_start,
    b.period_end,
    b.bill_date,
    b.due_date,

    b.subtotal,
    b.previous_balance_amount,
    b.discount_amount,
    b.adjustment_amount,
    b.total_amount,

    coalesce(
        kiraya.get_bill_paid_amount(b.id),
        0
    ) as paid_amount,

    kiraya.get_bill_balance(b.id)
        as outstanding_amount,

    case
        when b.status = 'VOID'
            then 'VOID'

        when kiraya.get_bill_balance(b.id) <= 0
            then 'PAID'

        when kiraya.get_bill_paid_amount(b.id) > 0
            then 'PARTIALLY_PAID'

        when b.due_date is not null
             and b.due_date < current_date
            then 'OVERDUE'

        else 'UNPAID'
    end as calculated_status,

    b.status as stored_status

from kiraya.bills b

join kiraya.tenants t
    on t.id = b.tenant_id

left join kiraya.leases l
    on l.id = b.lease_id

left join kiraya.units u
    on u.id = b.unit_id

left join kiraya.properties p
    on p.id = u.property_id;