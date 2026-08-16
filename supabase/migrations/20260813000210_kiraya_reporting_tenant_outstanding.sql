-- ============================================================
-- KIRAYA
-- P3.1: tenant outstanding reporting
--
-- Uses the actual Kiraya schema:
--
-- tenants.display_name
-- tenants.phone
-- leases.lease_code
-- units.unit_code
-- properties.property_code
-- status instead of is_active
-- ============================================================

create or replace view kiraya.v_tenant_outstanding
with (security_invoker = true)
as
select
    t.id as tenant_id,
    t.organization_id,

    t.tenant_code,
    t.display_name as tenant_name,
    t.phone,

    l.id as lease_id,
    l.lease_code,

    l.unit_id,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.unit_code,
    u.name as unit_name,

    coalesce(
        kiraya.get_tenant_due(t.id),
        0
    ) as amount_due,

    coalesce(
        kiraya.get_tenant_credit(t.id),
        0
    ) as credit_balance,

    case
        when coalesce(
            kiraya.get_tenant_due(t.id),
            0
        ) > 0
            then 'DUE'

        when coalesce(
            kiraya.get_tenant_credit(t.id),
            0
        ) > 0
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

where t.status = 'ACTIVE';