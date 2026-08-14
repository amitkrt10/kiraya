-- ============================================================
-- KIRAYA
-- Migration: lease expiry reporting
-- ============================================================

create or replace view kiraya.v_lease_expiry_alerts
with (security_invoker = true)
as
select
    l.organization_id,

    l.id as lease_id,
    l.lease_number,

    t.id as tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,
    t.phone_number,

    p.id as property_id,
    p.name as property_name,

    u.id as unit_id,
    u.unit_number,

    l.agreement_end_date,

    (
        l.agreement_end_date - current_date
    ) as days_until_expiry,

    case
        when l.agreement_end_date < current_date
            then 'EXPIRED'

        when l.agreement_end_date <= current_date + 7
            then 'EXPIRING_7_DAYS'

        when l.agreement_end_date <= current_date + 30
            then 'EXPIRING_30_DAYS'

        when l.agreement_end_date <= current_date + 60
            then 'EXPIRING_60_DAYS'

        when l.agreement_end_date <= current_date + 90
            then 'EXPIRING_90_DAYS'

        else 'ACTIVE'
    end as alert_status

from kiraya.leases l

join kiraya.tenants t
    on t.id = l.tenant_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id

where l.status = 'ACTIVE'
  and l.agreement_end_date is not null
  and l.agreement_end_date <= current_date + 90;