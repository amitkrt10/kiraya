-- ============================================================
-- KIRAYA
-- Migration: deposit refund RLS
-- ============================================================


-- ------------------------------------------------------------
-- Deposit refunds
--
-- Tenant:
--   Can see refund information for own deposit.
--
-- Organization:
--   Can create/update refunds.
-- ------------------------------------------------------------

create policy deposit_refunds_select
on kiraya.deposit_refunds
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy deposit_refunds_insert
on kiraya.deposit_refunds
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy deposit_refunds_update
on kiraya.deposit_refunds
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