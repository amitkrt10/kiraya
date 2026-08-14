-- ============================================================
-- KIRAYA
-- Migration: property RLS
-- ============================================================

-- ------------------------------------------------------------
-- Property types
-- ------------------------------------------------------------

create policy property_types_select
on kiraya.property_types
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy property_types_insert
on kiraya.property_types
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy property_types_update
on kiraya.property_types
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Properties
-- ------------------------------------------------------------

create policy properties_select
on kiraya.properties
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy properties_insert
on kiraya.properties
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy properties_update
on kiraya.properties
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Units / flats / offices / warehouses / land
-- ------------------------------------------------------------

create policy unit_types_select
on kiraya.unit_types
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy unit_types_insert
on kiraya.unit_types
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy unit_types_update
on kiraya.unit_types
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


create policy units_select
on kiraya.units
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy units_insert
on kiraya.units
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy units_update
on kiraya.units
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);