-- ============================================================
-- KIRAYA
-- P2.3: import RLS repair
-- ============================================================


drop policy if exists imports_select
on kiraya.imports;

drop policy if exists imports_insert
on kiraya.imports;

drop policy if exists imports_update
on kiraya.imports;


create policy imports_select
on kiraya.imports
for select
to authenticated
using (
    kiraya.can_import_organization(
        organization_id
    )
);


create policy imports_insert
on kiraya.imports
for insert
to authenticated
with check (
    kiraya.can_import_organization(
        organization_id
    )
);


create policy imports_update
on kiraya.imports
for update
to authenticated
using (
    kiraya.can_import_organization(
        organization_id
    )
)
with check (
    kiraya.can_import_organization(
        organization_id
    )
);