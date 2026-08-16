create or replace view kiraya.v_exit_tenant_dues
with (security_invoker = true) as
select
    es.organization_id,
    es.id as exit_settlement_id,
    es.settlement_reference as settlement_code,
    t.id as tenant_id, t.tenant_code, t.display_name as tenant_name,
    l.id as lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code, u.name as unit_name,
    es.previous_dues,
    es.final_charges,
    es.deposit_deduction,
    es.tenant_credit,
    es.final_amount_due,
    es.final_amount_refundable,
    case when es.final_amount_due > 0 then 'PAYABLE'
         when es.final_amount_refundable > 0 then 'REFUND'
         else 'SETTLED' end as settlement_direction,
    es.status as settlement_status,
    es.settlement_date
from kiraya.exit_settlements es
join kiraya.tenants t on t.id=es.tenant_id
join kiraya.leases l on l.id=es.lease_id
join kiraya.units u on u.id=l.unit_id
join kiraya.properties p on p.id=u.property_id;
