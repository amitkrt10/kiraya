create or replace view kiraya.v_tenant_bill_summary
with (security_invoker = true) as
select
    b.organization_id,
    b.id as bill_id, b.bill_number,
    b.tenant_id, t.tenant_code, t.display_name as tenant_name, t.phone,
    b.lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code, u.name as unit_name,
    b.period_start as billing_period_start,
    b.period_end as billing_period_end,
    b.bill_date, b.due_date, b.status,
    b.subtotal, b.discount_amount, b.adjustment_amount,
    b.previous_balance_amount, b.total_amount,
    coalesce(kiraya.get_bill_paid_amount(b.id),0) as paid_amount,
    coalesce(kiraya.get_bill_balance(b.id),0) as balance_amount,
    case when b.status='VOID' then 'VOID'
         when kiraya.get_bill_balance(b.id) <= 0 then 'PAID'
         when kiraya.get_bill_paid_amount(b.id) > 0 then 'PARTIALLY_PAID'
         else 'UNPAID' end as payment_state
from kiraya.bills b
join kiraya.tenants t on t.id=b.tenant_id
left join kiraya.leases l on l.id=b.lease_id
left join kiraya.units u on u.id=b.unit_id
left join kiraya.properties p on p.id=u.property_id;
