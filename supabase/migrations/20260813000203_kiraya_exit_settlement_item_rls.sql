-- ============================================================
-- KIRAYA
-- Migration: exit settlement item RLS
-- ============================================================


-- ------------------------------------------------------------
-- Exit settlement items
-- ------------------------------------------------------------

create policy exit_settlement_items_select
on kiraya.exit_settlement_items
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.exit_settlements es
        where es.id = exit_settlement_id
          and kiraya.can_access_tenant(
              es.organization_id,
              es.tenant_id
          )
    )
);


create policy exit_settlement_items_insert
on kiraya.exit_settlement_items
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.exit_settlements es
        where es.id = exit_settlement_id
          and kiraya.can_write_organization(
              es.organization_id
          )
    )
);


create policy exit_settlement_items_update
on kiraya.exit_settlement_items
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.exit_settlements es
        where es.id = exit_settlement_id
          and kiraya.can_write_organization(
              es.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.exit_settlements es
        where es.id = exit_settlement_id
          and kiraya.can_write_organization(
              es.organization_id
          )
    )
);