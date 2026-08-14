-- ============================================================
-- KIRAYA
-- Migration: organization dashboard summary
-- ============================================================

create or replace view kiraya.v_organization_dashboard
with (security_invoker = true)
as
select
    o.id as organization_id,
    o.name as organization_name,

    (
        select count(*)
        from kiraya.properties p
        where p.organization_id = o.id
          and p.is_active = true
    ) as property_count,

    (
        select count(*)
        from kiraya.units u
        where u.organization_id = o.id
          and u.is_active = true
    ) as unit_count,

    (
        select count(*)
        from kiraya.units u
        where u.organization_id = o.id
          and u.status = 'OCCUPIED'
          and u.is_active = true
    ) as occupied_unit_count,

    (
        select count(*)
        from kiraya.units u
        where u.organization_id = o.id
          and u.status = 'VACANT'
          and u.is_active = true
    ) as vacant_unit_count,

    (
        select count(*)
        from kiraya.leases l
        where l.organization_id = o.id
          and l.status = 'ACTIVE'
    ) as active_lease_count,

    (
        select count(*)
        from kiraya.tenants t
        where t.organization_id = o.id
          and t.is_active = true
    ) as active_tenant_count,

    (
        select coalesce(
            sum(
                kiraya.get_tenant_due(t.id)
            ),
            0
        )
        from kiraya.tenants t
        where t.organization_id = o.id
          and t.is_active = true
    ) as total_dues,

    (
        select coalesce(
            sum(
                kiraya.get_tenant_credit(t.id)
            ),
            0
        )
        from kiraya.tenants t
        where t.organization_id = o.id
          and t.is_active = true
    ) as total_tenant_credit,

    (
        select coalesce(
            sum(p.amount),
            0
        )
        from kiraya.payments p
        where p.organization_id = o.id
          and p.status = 'POSTED'
          and date_trunc(
              'month',
              p.payment_date
          ) = date_trunc(
              'month',
              current_date
          )
    ) as current_month_collection;
    
from kiraya.organizations o

where o.is_active = true;