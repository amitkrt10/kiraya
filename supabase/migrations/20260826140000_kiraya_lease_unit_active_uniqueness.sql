-- ============================================================
-- KIRAYA
-- P6.2-C: one unit, one active occupancy
--
-- Business rule (confirmed in P6.2-A/P6.2-B):
--   - ONE UNIT may have at most ONE ACTIVE lease at a time.
--   - ONE TENANT may hold multiple ACTIVE leases across different
--     units simultaneously -- this remains fully supported since
--     the constraint below is scoped to unit_id only.
--
-- Prior to this migration, kiraya.validate_lease_overlap() was the
-- only guard against double occupancy, and it only rejects
-- *overlapping date ranges* for a unit -- it does not prevent two
-- leases from both sitting in status = 'ACTIVE' with non-overlapping
-- ranges (e.g. a successor lease created for after a move-out while
-- the outgoing lease's exit was never completed). The P6.2-B audit
-- found exactly two such units in the hosted dev database, both
-- traced to synthetic E2E fixtures whose exit flow finalized a
-- settlement but never called kiraya.complete_tenant_exit() (the
-- only path that sets a lease to ENDED) -- cleaned up separately as
-- part of P6.2-C before this migration.
--
-- This index is the authoritative unit-exclusivity guarantee for
-- "currently occupied." It intentionally does NOT include DRAFT --
-- per the P6.2-B audit, DRAFT is not meant to permanently reserve a
-- unit the way ACTIVE does, even though kiraya.validate_lease_overlap()
-- and kiraya.complete_tenant_exit() currently still treat DRAFT as
-- unit-reserving for date-overlap purposes. Reconciling that is
-- separate follow-up work, not part of this migration.
--
-- Known workflow implication, not resolved here: a successor lease
-- for a unit whose current occupant is still ACTIVE must be created
-- as DRAFT (or with a status change deferred) until the outgoing
-- lease is transitioned to ENDED -- creating it as ACTIVE while the
-- current occupant is still ACTIVE will now be correctly rejected by
-- this index, whereas before this migration it was silently allowed
-- for non-overlapping date ranges.
-- ============================================================

create unique index leases_unit_active_unique_idx
on kiraya.leases (unit_id)
where status = 'ACTIVE';

comment on index kiraya.leases_unit_active_unique_idx is
    'Enforces at most one ACTIVE lease per unit at a time. A tenant may still hold multiple ACTIVE leases across different units.';
