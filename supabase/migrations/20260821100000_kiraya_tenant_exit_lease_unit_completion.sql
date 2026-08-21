-- ============================================================
-- KIRAYA
-- Migration: tenant exit completion ends the lease and frees the
-- unit (P5.4E Defect #1 -- structural gap found during the
-- mandatory pre-implementation inspection, not assumed safe merely
-- because P5.4D passed)
--
-- Problem:
-- kiraya.complete_tenant_exit() (P5.4D) only ever transitioned
-- tenant_exits.status. Nothing in the schema ever sets
-- leases.status='ENDED', leases.actual_end_date, or
-- units.status='VACANT' as part of the exit process (confirmed by
-- exhaustive inspection -- zero matches for any such assignment
-- anywhere). Since kiraya.validate_lease_overlap() reserves a unit
-- through coalesce(actual_end_date, agreement_end_date) for any
-- ACTIVE/ENDED/DRAFT lease, and unit occupancy reporting reads
-- units.status directly (not derived from lease dates), a
-- completed exit left the system in a self-contradictory state:
-- exit COMPLETED, settlement FINALIZED, deposit refunded -- but
-- the lease still ACTIVE through its original end date and the
-- unit still occupied, blocking the unit from ever being re-leased
-- through the normal system flow without an unprompted, manual,
-- out-of-band edit.
--
-- Fix:
-- kiraya.complete_tenant_exit() now atomically, in the same
-- transaction as the tenant_exits transition:
--   1. Row-locks and validates the exit's own lease (confirms it
--      actually belongs to the exit's stated tenant/organization --
--      no existing trigger enforces this cross-consistency the way
--      validate_unit_organization/validate_lease_organization do
--      for their own tables, so the function checks it itself).
--   2. Ends that lease: status = 'ENDED', actual_end_date =
--      tenant_exits.actual_exit_date, falling back to current_date
--      only when actual_exit_date is genuinely null.
--   3. Frees the unit (status = 'VACANT') ONLY if no OTHER lease on
--      that same unit currently has status in ('ACTIVE','DRAFT') --
--      the identical set kiraya.validate_lease_overlap() itself
--      already treats as reserving occupancy. This is not a blind
--      UPDATE: validate_lease_overlap() only blocks overlapping
--      date ranges, not two simultaneously-ACTIVE leases on the
--      same unit with non-overlapping ranges (e.g. an incoming
--      tenant's lease already created for after this move-out) --
--      so an unconditional VACANT write could silently clobber a
--      real, upcoming occupancy. The guard checks for that
--      explicitly and leaves unit status untouched when found.
--
-- Ending the exiting tenant's own lease can only ever shrink its
-- date range (agreement_end_date -> actual_exit_date), which cannot
-- newly trigger validate_lease_overlap() against any other lease.
-- If actual_exit_date is later than the original agreement_end_date
-- and a genuine conflict exists with another lease, that trigger
-- correctly rejects the whole completion -- intended behavior, not
-- bypassed here (kiraya.financial_context is irrelevant to that
-- trigger; it is unconditional).
--
-- Known, accepted, narrow limitation (pre-existing architecture,
-- not introduced here): a race exists between the "any other
-- active/draft lease?" check and the VACANT write -- closing it
-- fully would require the lease-creation path to also lock/check
-- unit status, which it never has (unit status has always been a
-- separately-managed signal in this schema, per the P5.2C design
-- note that it is "never inferred from tenant presence"). Not
-- expanded in this repair.
--
-- Confirmed via live trigger inventory before writing this: no
-- existing mechanism syncs unit status from lease changes (zero
-- matches for any such trigger on kiraya.leases or kiraya.units) --
-- this is not a duplicate of anything that already exists.
--
-- Signature, return type, and security mode are unchanged.
-- ============================================================

create or replace function kiraya.complete_tenant_exit(
    p_tenant_exit_id uuid,
    p_completed_by uuid default null
)
returns kiraya.tenant_exits
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_exit kiraya.tenant_exits%rowtype;
    v_settlement kiraya.exit_settlements%rowtype;
    v_lease kiraya.leases%rowtype;
    v_end_date date;
    v_other_lease_reserves_unit boolean;
begin

    select *
    into v_exit
    from kiraya.tenant_exits
    where id = p_tenant_exit_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Tenant exit does not exist.';
    end if;

    if v_exit.status <> 'PENDING_SETTLEMENT' then
        raise exception
            using
                errcode = '23514',
                message = 'Only a tenant exit pending settlement can be completed.';
    end if;


    select *
    into v_settlement
    from kiraya.exit_settlements
    where tenant_exit_id = p_tenant_exit_id;

    if not found or v_settlement.status <> 'FINALIZED' then
        raise exception
            using
                errcode = '23514',
                message = 'The exit settlement must be finalized before the exit can be completed.';
    end if;


    select *
    into v_lease
    from kiraya.leases
    where id = v_exit.lease_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'The tenant exit''s lease does not exist.';
    end if;

    if v_lease.tenant_id is distinct from v_exit.tenant_id
       or v_lease.organization_id is distinct from v_exit.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Tenant exit lease/tenant/organization mismatch.';
    end if;


    v_end_date := coalesce(v_exit.actual_exit_date, current_date);


    perform set_config('kiraya.financial_context', '1', true);

    update kiraya.tenant_exits
    set
        status = 'COMPLETED',
        metadata = metadata || jsonb_build_object(
            'completed_by', p_completed_by,
            'completed_at', now()
        ),
        updated_at = now()
    where id = p_tenant_exit_id
    returning * into v_exit;


    update kiraya.leases
    set
        status = 'ENDED',
        actual_end_date = v_end_date,
        updated_at = now()
    where id = v_lease.id;


    /*
     * Only free the unit if no other lease already reserves it --
     * the same status set validate_lease_overlap() itself treats
     * as reserving occupancy. An unconditional write here could
     * silently clobber a legitimate incoming tenant's lease.
     */
    select exists (
        select 1
        from kiraya.leases
        where unit_id = v_lease.unit_id
          and id <> v_lease.id
          and status in ('ACTIVE', 'DRAFT')
    )
    into v_other_lease_reserves_unit;

    if not v_other_lease_reserves_unit then
        update kiraya.units
        set
            status = 'VACANT',
            updated_at = now()
        where id = v_lease.unit_id;
    end if;


    return v_exit;
end;
$$;
