-- ============================================================
-- KIRAYA
-- Migration: import RLS
-- ============================================================


-- ------------------------------------------------------------
-- Imports
--
-- CSV imports are available to:
--
--   SUPER_ADMIN
--   CLIENT_ADMIN
--
-- Normal VIEW / WRITE members do not get import access unless
-- their role explicitly has the IMPORT permission.
-- ------------------------------------------------------------

create policy imports_select
on kiraya.imports
for select
to authenticated
using (
    kiraya.is_super_admin()
    or kiraya.has_organization_permission(
        organization_id,
        'IMPORT'
    )
);


create policy imports_insert
on kiraya.imports
for insert
to authenticated
with check (
    kiraya.is_super_admin()
    or kiraya.has_organization_permission(
        organization_id,
        'IMPORT'
    )
);


create policy imports_update
on kiraya.imports
for update
to authenticated
using (
    kiraya.is_super_admin()
    or kiraya.has_organization_permission(
        organization_id,
        'IMPORT'
    )
)
with check (
    kiraya.is_super_admin()
    or kiraya.has_organization_permission(
        organization_id,
        'IMPORT'
    )
);