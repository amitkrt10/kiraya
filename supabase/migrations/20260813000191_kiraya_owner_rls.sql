-- ============================================================
-- KIRAYA
-- Migration: owner RLS
-- ============================================================


-- ------------------------------------------------------------
-- Owners
-- ------------------------------------------------------------

create policy owners_select
on kiraya.owners
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy owners_insert
on kiraya.owners
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy owners_update
on kiraya.owners
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Property ownership
-- ------------------------------------------------------------

create policy property_ownerships_select
on kiraya.property_ownerships
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);

create policy property_ownerships_insert
on kiraya.property_ownerships
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);

create policy property_ownerships_update
on kiraya.property_ownerships
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);