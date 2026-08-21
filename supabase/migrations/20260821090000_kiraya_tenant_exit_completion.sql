-- ============================================================
-- KIRAYA
-- Migration: tenant exit completion (P5.4D Defect #1)
--
-- Problem:
-- No function in the schema ever transitions kiraya.tenant_exits.
-- status to COMPLETED (confirmed by inspection: exactly one
-- function, finalize_exit_settlement(), ever writes to this
-- column, and it only ever sets PENDING_SETTLEMENT). COMPLETED
-- and CANCELLED are unreachable enum values. RLS
-- (tenant_exits_update) permits any org-write user to set status
-- to anything via a direct UPDATE, with no validation.
--
-- Fix:
-- A narrow, authoritative kiraya.complete_tenant_exit() function --
-- same shape as kiraya.finalize_exit_settlement()/kiraya.
-- finalize_bill(): row-locks the exit, requires the current status
-- to be PENDING_SETTLEMENT, requires the linked exit_settlements
-- row to be FINALIZED, transitions to COMPLETED. Completion
-- metadata is stored in the existing metadata jsonb column --
-- tenant_exits has no completed_at/completed_by column, and none
-- is added here.
--
-- A companion BEFORE UPDATE trigger blocks any further direct
-- mutation of a COMPLETED exit outside the established
-- kiraya.financial_context gate (same pattern as
-- prevent_finalized_bill_mutation/prevent_posted_payment_mutation).
-- complete_tenant_exit() itself does not need to set this context:
-- its own UPDATE transitions FROM PENDING_SETTLEMENT, a status the
-- trigger does not protect, exactly like finalize_bill()'s and
-- finalize_exit_settlement()'s DRAFT->FINALIZED transitions need
-- no such escape hatch today.
--
-- CANCELLED remains unreachable -- no authoritative workflow exists
-- for cancelling a tenant exit, and none is added here (out of
-- scope for this repair; not invented).
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


comment on function kiraya.complete_tenant_exit(uuid, uuid) is
    'Transitions a tenant exit from PENDING_SETTLEMENT to COMPLETED once its settlement is finalized.';


create or replace function kiraya.prevent_completed_tenant_exit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    if old.status = 'COMPLETED'
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'A completed tenant exit cannot be modified directly.';
    end if;

    return new;
end;
$$;


drop trigger if exists trg_prevent_completed_tenant_exit_mutation
on kiraya.tenant_exits;

create trigger trg_prevent_completed_tenant_exit_mutation
before update on kiraya.tenant_exits
for each row execute function kiraya.prevent_completed_tenant_exit_mutation();


comment on function kiraya.prevent_completed_tenant_exit_mutation() is
    'Blocks direct mutation of a COMPLETED tenant exit outside an authorized financial function.';
