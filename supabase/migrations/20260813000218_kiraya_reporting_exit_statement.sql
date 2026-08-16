create or replace view kiraya.v_exit_tenant_statement
with (security_invoker = true) as
select
    es.organization_id,
    es.id as exit_settlement_id,
    es.settlement_reference as settlement_code,
    es.tenant_id, t.tenant_code, t.display_name as tenant_name, t.phone,
    es.lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code, u.name as unit_name,
    l.occupancy_start_date, l.actual_end_date,
    es.settlement_date, es.status as settlement_status,
    coalesce(kiraya.get_tenant_due(es.tenant_id),0) as tenant_due,
    coalesce(kiraya.get_tenant_credit(es.tenant_id),0) as tenant_credit,
    coalesce(sd.required_amount,0) as deposit_required,
    coalesce(sd.received_amount,0) as deposit_received,
    coalesce(sd.deducted_amount,0) as deposit_deducted,
    coalesce(sd.refunded_amount,0) as deposit_refunded,
    greatest(0,coalesce(sd.received_amount,0)-coalesce(sd.deducted_amount,0)-coalesce(sd.refunded_amount,0)) as deposit_held,
    es.previous_dues,
    es.final_charges,
    es.deposit_deduction,
    es.tenant_credit as settlement_credit,
    es.final_amount_due,
    es.final_amount_refundable,
    es.created_at,
    es.finalized_at
from kiraya.exit_settlements es
join kiraya.tenants t on t.id=es.tenant_id
join kiraya.leases l on l.id=es.lease_id
join kiraya.units u on u.id=l.unit_id
join kiraya.properties p on p.id=u.property_id
left join kiraya.security_deposits sd on sd.lease_id=es.lease_id;
