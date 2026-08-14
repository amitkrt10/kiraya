-- ============================================================
-- KIRAYA
-- Migration: security deposit transaction RLS
-- ============================================================


-- ------------------------------------------------------------
-- Deposit transaction history
--
-- Tenant:
--   SELECT only.
--
-- Organization:
--   SELECT + controlled writes.
-- ------------------------------------------------------------

create policy security_deposit_transactions_select
on kiraya.security_deposit_transactions
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


create policy security_deposit_transactions_insert
on kiraya.security_deposit_transactions
for insert
to authenticated
with check (
    kiraya.can_write_organization(
        organization_id
    )
);


create policy security_deposit_transactions_update
on kiraya.security_deposit_transactions
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