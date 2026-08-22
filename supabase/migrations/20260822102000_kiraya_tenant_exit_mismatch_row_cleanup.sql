-- ============================================================
-- KIRAYA
-- Migration: cleanup of the P5.7J cross-organization test artifact (P5.7K)
--
-- Purpose:
-- The P5.7J audit confirmed a live cross-organization authorization
-- bypass by inserting a real tenant_exits row: organization_id = Org A,
-- lease_id = a genuine Org A lease, tenant_id = a genuine Org B tenant.
-- The insert succeeded (no organization/lease/tenant consistency
-- trigger existed on kiraya.tenant_exits at the time). No client DELETE
-- policy exists on kiraya.tenant_exits, so this row could not be
-- removed through the application; it has remained in the database
-- exactly as created.
--
-- 20260822100000_kiraya_tenant_exit_organization_integrity.sql now
-- prevents any new row like this from ever being created. This
-- migration removes the one specific pre-existing row, and only that
-- row: confirmed immediately before this migration was written to
-- still be status = INITIATED, with zero exit_settlements,
-- zero deposit_refunds, and zero tenant_credit_refunds referencing it
-- -- i.e. it never had any downstream financial effect.
--
-- The WHERE clause matches the row's id together with its known
-- organization_id, tenant_id, and status, so this statement is a safe
-- no-op if the row's expected shape has changed for any reason since
-- this migration was written, and it can never match any other row.
--
-- This does not add a DELETE policy, does not create a general
-- cleanup mechanism, and does not touch any other tenant_exits row.
-- ============================================================

delete from kiraya.tenant_exits
where id = '02286efa-1ab3-4b96-aa11-e988211b7ed2'
  and organization_id = '5242eace-d8a9-4ccc-8308-eb9e5922f47e'
  and tenant_id = '3d8a78b5-d4ae-4035-b83a-c38c3dbdcb5e'
  and status = 'INITIATED';
