-- ============================================================
-- KIRAYA
-- Migration: ledger RLS
--
-- IMPORTANT:
-- The ledger is financial history.
--
-- Normal users should NEVER directly modify ledger entries.
-- Ledger changes happen through controlled database functions.
-- ============================================================


create policy ledger_entries_select
on kiraya.ledger_entries
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        tenant_id
    )
);


-- ------------------------------------------------------------
-- No INSERT / UPDATE / DELETE policies intentionally.
--
-- Financial entries are created by SECURITY INVOKER functions
-- executed through controlled application flows.
--
-- We will later add a dedicated service-role / RPC boundary
-- for privileged financial operations.
-- ------------------------------------------------------------