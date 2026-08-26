-- ============================================================
-- KIRAYA
-- P6.3-B: unit assignability
--
-- The ONE authoritative mechanism for "can this unit be assigned a
-- tenant right now" -- deliberately NOT units.status. P6.3-A found
-- units.status badly desynced from reality (36 of 71 hosted units
-- marked VACANT while actually carrying an ACTIVE lease), so it
-- cannot be trusted as a vacancy signal. This migration does not
-- touch units.status at all -- MAINTENANCE/UNAVAILABLE keep their
-- existing, independent meaning (a unit can be simultaneously
-- "not currently leased" and "not assignable" for operational
-- reasons unrelated to occupancy).
--
-- A unit is assignable when:
--   - its status is not MAINTENANCE or UNAVAILABLE
--   - it has no lease with status = 'ACTIVE'
--
-- This is a convenience/precondition check only. The actual,
-- final concurrency guarantee remains leases_unit_active_unique_idx
-- (P6.2-C) -- a partial unique index on kiraya.leases(unit_id) where
-- status = 'ACTIVE'. Two concurrent callers can both pass this
-- function's check before either commits; only one of their
-- subsequent lease INSERTs will actually succeed, and the other
-- fails with a 23505 unique-violation from that index, not from
-- this function. See kiraya.create_tenant_unit_assignment() (next
-- migration) for how the two layers compose.
--
-- kiraya.v_assignable_units is defined directly in terms of this
-- function (not a parallel reimplementation of the same predicate)
-- so the two can never drift out of sync -- this is the "ONE
-- mechanism" the checkpoint asks for, not two.
-- ============================================================

create or replace function kiraya.unit_is_assignable(p_unit_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select exists (
        select 1
        from kiraya.units u
        where u.id = p_unit_id
          and u.status not in ('MAINTENANCE', 'UNAVAILABLE')
          and not exists (
              select 1
              from kiraya.leases l
              where l.unit_id = u.id
                and l.status = 'ACTIVE'
          )
    );
$$;

comment on function kiraya.unit_is_assignable(uuid) is
    'P6.3-B: the one authoritative check for "can this unit be assigned a tenant now" -- status not MAINTENANCE/UNAVAILABLE and no ACTIVE lease. Never units.status = VACANT/OCCUPIED, which is unreliable. A precondition/convenience check only -- leases_unit_active_unique_idx is the actual concurrency guarantee.';

create or replace view kiraya.v_assignable_units
with (security_invoker = true)
as
select u.*
from kiraya.units u
where kiraya.unit_is_assignable(u.id);

comment on view kiraya.v_assignable_units is
    'P6.3-B: every currently-assignable unit, built directly on kiraya.unit_is_assignable() so the two can never disagree. security_invoker means this view only ever shows units the caller''s own units RLS policy already permits.';
