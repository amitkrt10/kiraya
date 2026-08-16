-- ============================================================
-- KIRAYA
-- P3.5: lease expiry alerts
--
-- Alert windows:
--
--   EXPIRED
--   7 days
--   30 days
--   60 days
--   90 days
-- ============================================================


create or replace view kiraya.v_lease_expiry_alerts
with (security_invoker = true)
as
select
    l.organization_id,

    l.id as lease_id,
    l.lease_code,

    t.id as tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,
    t.phone,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.id as unit_id,
    u.unit_code,
    u.name as unit_name,

    l.agreement_end_date,

    (
        l.agreement_end_date
        - current_date
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

  and l.agreement_end_date
      <= current_date + 90;