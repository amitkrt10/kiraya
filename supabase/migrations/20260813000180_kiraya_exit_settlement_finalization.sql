-- ============================================================
-- KIRAYA
-- Migration: exit settlement finalization
--
-- Purpose:
-- Finalizes an exit settlement after recalculating it.
--
-- Financial history is preserved.
-- ============================================================

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