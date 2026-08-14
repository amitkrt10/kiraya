-- ============================================================
-- KIRAYA
-- Migration: utility and meter RLS
-- ============================================================


-- ------------------------------------------------------------
-- Utilities
-- ------------------------------------------------------------

create policy utilities_select
on kiraya.utilities
for select
to authenticated
using (
    organization_id is null
    or kiraya.can_access_organization(organization_id)
);


create policy utilities_insert
on kiraya.utilities
for insert
to authenticated
with check (
    organization_id is null
    or kiraya.can_write_organization(organization_id)
);


create policy utilities_update
on kiraya.utilities
for update
to authenticated
using (
    organization_id is null
    or kiraya.can_write_organization(organization_id)
)
with check (
    organization_id is null
    or kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Utility configurations
-- ------------------------------------------------------------

create policy utility_configurations_select
on kiraya.utility_configurations
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy utility_configurations_insert
on kiraya.utility_configurations
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy utility_configurations_update
on kiraya.utility_configurations
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Utility rates
-- ------------------------------------------------------------

create policy utility_rates_select
on kiraya.utility_rates
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy utility_rates_insert
on kiraya.utility_rates
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy utility_rates_update
on kiraya.utility_rates
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Meters
-- ------------------------------------------------------------

create policy meters_select
on kiraya.meters
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy meters_insert
on kiraya.meters
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy meters_update
on kiraya.meters
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Meter reading batches
-- ------------------------------------------------------------

create policy meter_reading_batches_select
on kiraya.meter_reading_batches
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy meter_reading_batches_insert
on kiraya.meter_reading_batches
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy meter_reading_batches_update
on kiraya.meter_reading_batches
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Meter readings
-- ------------------------------------------------------------

create policy meter_readings_select
on kiraya.meter_readings
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy meter_readings_insert
on kiraya.meter_readings
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy meter_readings_update
on kiraya.meter_readings
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);