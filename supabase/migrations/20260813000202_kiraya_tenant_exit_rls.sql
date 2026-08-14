-- ============================================================
-- KIRAYA
-- Migration: tenant exit RLS
-- ============================================================


-- ------------------------------------------------------------
-- Tenant exits
-- ------------------------------------------------------------

create policy tenant_exits_select
on kiraya.tenant_exits
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy tenant_exits_insert
on kiraya.tenant_exits
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy tenant_exits_update
on kiraya.tenant_exits
for update
to authenticated
using (
    kiraya.can_write_organization(
        organization_id
    )
)
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


-- ------------------------------------------------------------
-- Exit settlements
-- ------------------------------------------------------------

create policy exit_settlements_select
on kiraya.exit_settlements
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy exit_settlements_insert
on kiraya.exit_settlements
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy exit_settlements_update
on kiraya.exit_settlements
for update
to authenticated
using (
    kiraya.can_write_organization(
        organization_id
    )
)
with check (
    kiraya.can_write_organization(
        organization_id
    )
);