-- ============================================================
-- KIRAYA
-- Migration: payment reversal
--
-- Purpose:
-- Reverses a posted payment without deleting its history.
--
-- Original payment remains untouched.
-- A reversal ledger entry is created.
-- Existing payment allocations are reversed separately.
-- ============================================================

create or replace function kiraya.reverse_payment(
    p_payment_id uuid,
    p_reversed_by uuid,
    p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_payment kiraya.payments%rowtype;
    v_original_entry kiraya.ledger_entries%rowtype;
    v_reversal_id uuid;
begin

    if p_reason is null
       or length(trim(p_reason)) = 0 then
        raise exception
            using
                errcode = '22023',
                message = 'A reason is required to reverse a payment.';
    end if;


    select *
    into v_payment
    from kiraya.payments
    where id = p_payment_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Payment does not exist.';
    end if;


    if v_payment.status <> 'POSTED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only posted payments can be reversed.';
    end if;


    select *
    into v_original_entry
    from kiraya.ledger_entries
    where payment_id = p_payment_id
      and entry_type = 'PAYMENT'
      and is_reversal = false
    order by created_at
    limit 1
    for update;


    if not found then
        raise exception
            using
                errcode = '23514',
                message = 'Payment ledger entry does not exist.';
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where reverses_entry_id = v_original_entry.id
    ) then
        raise exception
            using
                errcode = '23514',
                message = 'Payment has already been reversed.';
    end if;


    -- Reverse payment allocations first.
    perform kiraya.reverse_payment_allocations(
        p_payment_id,
        p_reversed_by,
        p_reason
    );


    -- Create accounting reversal.
    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        payment_id,
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
        v_original_entry.payment_id,
        'REVERSAL',
        current_date,
        'Reversal of payment '
            || v_payment.payment_number
            || ': '
            || trim(p_reason),
        v_original_entry.credit_amount,
        0,
        v_original_entry.currency_code,
        v_payment.payment_number,
        true,
        v_original_entry.id,
        p_reversed_by,
        jsonb_build_object(
            'reason', trim(p_reason)
        )
    )
    returning id into v_reversal_id;


    update kiraya.payments
    set
        status = 'REVERSED',
        updated_at = now()
    where id = p_payment_id;


    return v_reversal_id;
end;
$$;


comment on function kiraya.reverse_payment(uuid, uuid, text) is
    'Reverses a posted payment while preserving its complete historical record.';