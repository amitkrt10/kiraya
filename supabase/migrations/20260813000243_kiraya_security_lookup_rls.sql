-- ============================================================
-- KIRAYA
-- P2 repair: system lookup RLS
-- ============================================================

drop policy if exists property_types_select on kiraya.property_types;
drop policy if exists property_types_insert on kiraya.property_types;
drop policy if exists property_types_update on kiraya.property_types;
drop policy if exists unit_types_select on kiraya.unit_types;
drop policy if exists unit_types_insert on kiraya.unit_types;
drop policy if exists unit_types_update on kiraya.unit_types;

create policy property_types_select on kiraya.property_types
for select to authenticated
using (is_system = true or kiraya.can_access_organization(organization_id));

create policy property_types_insert on kiraya.property_types
for insert to authenticated
with check (is_system = false and kiraya.can_write_organization(organization_id));

create policy property_types_update on kiraya.property_types
for update to authenticated
using (is_system = false and kiraya.can_write_organization(organization_id))
with check (is_system = false and kiraya.can_write_organization(organization_id));

create policy unit_types_select on kiraya.unit_types
for select to authenticated
using (is_system = true or kiraya.can_access_organization(organization_id));

create policy unit_types_insert on kiraya.unit_types
for insert to authenticated
with check (is_system = false and kiraya.can_write_organization(organization_id));

create policy unit_types_update on kiraya.unit_types
for update to authenticated
using (is_system = false and kiraya.can_write_organization(organization_id))
with check (is_system = false and kiraya.can_write_organization(organization_id));
