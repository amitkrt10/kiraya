-- ============================================================
-- KIRAYA
-- Migration: exit settlement ledger
--
-- Purpose:
-- Posts the tenant's final exit settlement to the ledger.
--
-- Only the net amount payable by the tenant is posted as a
-- debit.
--
-- Deposit refunds are handled separately.
-- ============================================================

create or replace function kiraya.post_exit_settlement_to_ledger(
    p_exit_settlement_id uuid,
    p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_settlement kiraya.exit_settlements%rowtype;
    v_entry_id uuid;
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


    if v_settlement.status <> 'FINALIZED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only finalized exit settlements can be posted.';
    end if;


    /*
     * If tenant owes nothing, no debit is required.
     */
    if v_settlement.final_amount_due <= 0 then
        return null;
    end if;


    /*
     * Idempotency.
     */
    if exists (
        select 1
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'EXIT_SETTLEMENT'
          and is_reversal = false
    ) then

        select id
        into v_entry_id
        from kiraya.ledger_entries
        where exit_settlement_id = p_exit_settlement_id
          and entry_type = 'EXIT_SETTLEMENT'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;

    end if;


    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        exit_settlement_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        created_by,
        metadata
    )
    values (
        v_settlement.organization_id,
        v_settlement.tenant_id,
        v_settlement.lease_id,
        v_settlement.id,
        'EXIT_SETTLEMENT',
        v_settlement.settlement_date,
        'Final tenant exit settlement',
        v_settlement.final_amount_due,
        0,
        v_settlement.currency_code,
        v_settlement.settlement_reference,
        p_created_by,
        jsonb_build_object(
            'previous_dues',
            v_settlement.previous_dues,
            'final_charges',
            v_settlement.final_charges,
            'deposit_deduction',
            v_settlement.deposit_deduction,
            'tenant_credit',
            v_settlement.tenant_credit
        )
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$$;


comment on function kiraya.post_exit_settlement_to_ledger(uuid, uuid) is
    'Posts a finalized exit settlement amount due as a tenant ledger debit.';