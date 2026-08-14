-- ============================================================
-- KIRAYA
-- Migration: security deposit RLS
-- ============================================================


-- ------------------------------------------------------------
-- Security deposits
--
-- Organization users:
--   Full access according to organization permissions.
--
-- Tenant users:
--   Read-only access to their own deposit.
-- ------------------------------------------------------------

create policy security_deposits_select
on kiraya.security_deposits
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy security_deposits_insert
on kiraya.security_deposits
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy security_deposits_update
on kiraya.security_deposits
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