-- ============================================================
-- KIRAYA
-- P2.4: import error RLS repair
-- ============================================================


drop policy if exists import_errors_select
on kiraya.import_errors;

drop policy if exists import_errors_insert
on kiraya.import_errors;


create policy import_errors_select
on kiraya.import_errors
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.imports i
        where i.id = import_id
          and kiraya.can_import_organization(
              i.organization_id
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
          and kiraya.can_import_organization(
              i.organization_id
          )
    )
);