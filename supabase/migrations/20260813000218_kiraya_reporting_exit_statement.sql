-- ============================================================
-- KIRAYA
-- Migration: exit tenant statement
-- ============================================================

create or replace view kiraya.v_exit_tenant_statement
with (security_invoker = true)
as
select
    es.organization_id,

    es.id as exit_settlement_id,
    es.tenant_exit_id,

    es.tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,
    t.phone_number,

    es.lease_id,
    l.lease_number,

    p.id as property_id,
    p.name as property_name,

    u.id as unit_id,
    u.unit_number,

    es.settlement_date,

    es.previous_dues,
    es.final_charges,
    es.deposit_deduction,
    es.tenant_credit,

    es.final_amount_due,
    es.final_amount_refundable,

    es.status

from kiraya.exit_settlements es

join kiraya.tenants t
    on t.id = es.tenant_id

join kiraya.leases l
    on l.id = es.lease_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id;