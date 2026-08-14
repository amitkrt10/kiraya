-- ============================================================
-- KIRAYA
-- Migration: import error RLS
-- ============================================================


-- ------------------------------------------------------------
-- Import errors
--
-- Access is inherited from the parent import.
-- ------------------------------------------------------------

create policy import_errors_select
on kiraya.import_errors
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.imports i
        where i.id = import_id
          and (
              kiraya.is_super_admin()
              or kiraya.has_organization_permission(
                  i.organization_id,
                  'IMPORT'
              )
          )
    )
);


create policy import_errors_insert
on kiraya.import_errors
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.imports i
        where i.id = import_id
          and (
              kiraya.is_super_admin()
              or kiraya.has_organization_permission(
                  i.organization_id,
                  'IMPORT'
              )
          )
    )
);