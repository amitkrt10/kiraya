-- ============================================================
-- KIRAYA
-- Migration: fix exit/settlement transition-bypass gap
-- (P5.4D -- self-caught defect in the just-applied Defect #1/#2
-- repairs, found while designing live test scenarios, before any
-- test was run)
--
-- Problem:
-- kiraya.prevent_completed_tenant_exit_mutation() and kiraya.
-- prevent_finalized_exit_settlement_mutation() both checked
-- old.status in (protected values) -- mirroring kiraya.
-- prevent_finalized_bill_mutation()'s exact shape. That shape only
-- blocks FURTHER mutation of a row already in the protected state.
-- It does NOT block a direct client UPDATE that jumps straight
-- from an unprotected state into the protected one, bypassing the
-- authoritative function entirely -- e.g. tenant_exits SET
-- status='COMPLETED' WHERE status='PENDING_SETTLEMENT', or
-- exit_settlements SET status='FINALIZED', final_amount_due=
-- <anything> WHERE status='DRAFT'. That second case is the exact
-- attack Defect #2 was written to close, and the approved Defect
-- #1 text separately required "direct UPDATE to COMPLETED must be
-- rejected" as its own bullet, distinct from "completion before
-- FINALIZED rejected" -- both call for the stronger check.
--
-- Fix:
-- Both trigger functions now check new.status instead of
-- old.status. This is a strict superset of the previous condition
-- (it still catches every case old.status caught -- a mutation of
-- an already-protected row leaves new.status equal to the
-- protected value too -- plus the direct-transition-in bypass).
-- kiraya.complete_tenant_exit() and kiraya.finalize_exit_settlement()
-- now set kiraya.financial_context before their own writes, since
-- their legitimate transitions into the protected state now need
-- the escape hatch they previously did not.
--
-- Unaffected:
-- - kiraya.calculate_exit_settlement() never writes to the status
--   column (DRAFT-only recalculation) -- no context needed, DRAFT
--   settlements remain freely editable.
-- - kiraya.finalize_exit_settlement()'s own update to tenant_exits
--   sets status='PENDING_SETTLEMENT', never 'COMPLETED' -- the
--   tenant_exits trigger's condition does not fire for it either
--   way; setting financial_context for that statement too is
--   harmless.
-- - kiraya.prevent_finalized_exit_settlement_item_mutation() is
--   unaffected -- it already checks the PARENT settlement's live,
--   current status via its own SELECT, not an old/new distinction
--   on the item row, so it was never subject to this gap.
-- - kiraya.validate_deposit_refund_cap() is unaffected -- it is a
--   pure cumulative-sum cap check with no old/new status framing.
--
-- Signature, return type, and security mode are unchanged for both
-- corrected functions and for complete_tenant_exit()/
-- finalize_exit_settlement().
-- ============================================================

create or replace function kiraya.prevent_completed_tenant_exit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    if new.status = 'COMPLETED'
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'A tenant exit cannot be marked completed directly.';
    end if;

    return new;
end;
$$;


comment on function kiraya.prevent_completed_tenant_exit_mutation() is
    'Blocks any direct mutation setting a tenant exit to COMPLETED outside an authorized financial function.';


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


    return v_exit;
end;
$$;


create or replace function kiraya.prevent_finalized_exit_settlement_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    if new.status in ('FINALIZED', 'SETTLED')
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'An exit settlement cannot be finalized or modified directly.';
    end if;

    return new;
end;
$$;


comment on function kiraya.prevent_finalized_exit_settlement_mutation() is
    'Blocks any direct mutation setting an exit settlement to FINALIZED/SETTLED, or modifying one already in that state, outside an authorized financial function.';


create or replace function kiraya.finalize_exit_settlement(
    p_exit_settlement_id uuid,
    p_finalized_by uuid
)
returns kiraya.exit_settlements
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_settlement kiraya.exit_settlements%rowtype;
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;

    if v_settlement.status <> 'DRAFT' then
        raise exception
            using
                errcode = '23514',
                message = 'Only draft exit settlements can be finalized.';
    end if;


    /*
     * Always recalculate immediately before finalization.
     */
    v_settlement :=
        kiraya.calculate_exit_settlement(
            p_exit_settlement_id
        );


    perform set_config('kiraya.financial_context', '1', true);

    update kiraya.exit_settlements
    set
        status = 'FINALIZED',
        finalized_at = now(),
        finalized_by = p_finalized_by,
        updated_at = now()
    where id = p_exit_settlement_id
    returning * into v_settlement;


    /*
     * Mark the exit process as awaiting final payment/refund.
     */
    update kiraya.tenant_exits
    set
        status = 'PENDING_SETTLEMENT',
        updated_at = now()
    where id = v_settlement.tenant_exit_id
      and status in (
          'INITIATED',
          'PENDING_SETTLEMENT'
      );


    return v_settlement;
end;
$$;


comment on function kiraya.finalize_exit_settlement(uuid, uuid) is
    'Recalculates and finalizes a tenant exit settlement.';
