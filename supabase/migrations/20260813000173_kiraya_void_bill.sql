-- ============================================================
-- KIRAYA
-- Migration: void bill
--
-- Purpose:
-- Voids a finalized bill through a reversal entry.
--
-- IMPORTANT:
-- A finalized bill is never deleted.
--
-- The original ledger entry remains intact and a reversal
-- entry is created.
-- ============================================================

create or replace function kiraya.void_bill(
    p_bill_id uuid,
    p_voided_by uuid,
    p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_original_entry kiraya.ledger_entries%rowtype;
    v_reversal_id uuid;
begin

    if p_reason is null
       or length(trim(p_reason)) = 0 then
        raise exception
            using
                errcode = '22023',
                message = 'A reason is required to void a bill.';
    end if;

    select *
    into v_bill
    from kiraya.bills
    where id = p_bill_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;

    if v_bill.status <> 'FINALIZED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only finalized bills can be voided.';
    end if;

    select *
    into v_original_entry
    from kiraya.ledger_entries
    where bill_id = p_bill_id
      and entry_type = 'BILL'
      and is_reversal = false
    order by created_at
    limit 1
    for update;

    if not found then
        raise exception
            using
                errcode = '23514',
                message = 'Bill ledger entry does not exist.';
    end if;

    if exists (
        select 1
        from kiraya.ledger_entries
        where reverses_entry_id = v_original_entry.id
    ) then
        raise exception
            using
                errcode = '23514',
                message = 'Bill has already been reversed.';
    end if;

    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        bill_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        is_reversal,
        reverses_entry_id,
        created_by,
        metadata
    )
    values (
        v_original_entry.organization_id,
        v_original_entry.tenant_id,
        v_original_entry.lease_id,
        v_original_entry.bill_id,
        'REVERSAL',
        current_date,
        'Reversal of bill ' || v_bill.bill_number
            || ': ' || trim(p_reason),
        0,
        v_original_entry.debit_amount,
        v_original_entry.currency_code,
        v_bill.bill_number,
        true,
        v_original_entry.id,
        p_voided_by,
        jsonb_build_object(
            'reason', trim(p_reason)
        )
    )
    returning id into v_reversal_id;

    update kiraya.bills
    set
        status = 'VOID',
        updated_at = now()
    where id = p_bill_id;

    return v_reversal_id;
end;
$$;


comment on function kiraya.void_bill(uuid, uuid, text) is
    'Voids a finalized bill by creating a ledger reversal instead of deleting financial history.';