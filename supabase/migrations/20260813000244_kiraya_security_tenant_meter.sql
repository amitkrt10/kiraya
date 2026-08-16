-- ============================================================
-- KIRAYA
-- P2.6: tenant meter access
-- ============================================================


create or replace function kiraya.is_tenant_meter_user(
    p_meter_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.meters m

        join kiraya.units u
            on u.id = m.unit_id

        join kiraya.leases l
            on l.unit_id = u.id

        where m.id = p_meter_id
          and l.status = 'ACTIVE'
          and kiraya.is_tenant_user(
              l.tenant_id
          )
    );
$$;


-- ------------------------------------------------------------
-- Meters
-- ------------------------------------------------------------

drop policy if exists meters_select
on kiraya.meters;


create policy meters_select
on kiraya.meters
for select
to authenticated
using (
    kiraya.can_access_organization(
        organization_id
    )
    or kiraya.is_tenant_meter_user(id)
);


-- ------------------------------------------------------------
-- Meter reading batches
-- ------------------------------------------------------------

drop policy if exists meter_reading_batches_select
on kiraya.meter_reading_batches;


create policy meter_reading_batches_select
on kiraya.meter_reading_batches
for select
to authenticated
using (
    kiraya.can_access_organization(
        organization_id
    )
);


-- ------------------------------------------------------------
-- Meter readings
-- ------------------------------------------------------------

drop policy if exists meter_readings_select
on kiraya.meter_readings;


create policy meter_readings_select
on kiraya.meter_readings
for select
to authenticated
using (
    kiraya.can_access_organization(
        organization_id
    )
    or exists (
        select 1
        from kiraya.meters m
        where m.id = meter_id
          and kiraya.is_tenant_meter_user(
              m.id
          )
    )
);