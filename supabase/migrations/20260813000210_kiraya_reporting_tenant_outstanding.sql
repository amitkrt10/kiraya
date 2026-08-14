-- ============================================================
-- KIRAYA
-- Migration: tenant outstanding reporting
-- ============================================================

create or replace view kiraya.v_tenant_outstanding
with (security_invoker = true)
as
select
    t.id as tenant_id,
    t.organization_id,
    t.tenant_code,
    t.full_name as tenant_name,
    t.phone_number,

    l.id as lease_id,
    l.lease_number,
    l.unit_id,

    p.id as property_id,
    p.name as property_name,

    u.unit_number,
    u.unit_name,

    coalesce(
        kiraya.get_tenant_due(t.id),
        0
    ) as amount_due,

    coalesce(
        kiraya.get_tenant_credit(t.id),
        0
    ) as credit_balance,

    case
        when kiraya.get_tenant_due(t.id) > 0
            then 'DUE'
        when kiraya.get_tenant_credit(t.id) > 0
            then 'CREDIT'
        else 'SETTLED'
    end as balance_status

from kiraya.tenants t

left join kiraya.leases l
    on l.tenant_id = t.id
   and l.status = 'ACTIVE'

left join kiraya.units u
    on u.id = l.unit_id

left join kiraya.properties p
    on p.id = u.property_id

where t.is_active = true;