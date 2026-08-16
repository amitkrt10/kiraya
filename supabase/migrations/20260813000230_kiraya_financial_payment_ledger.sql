-- ============================================================
-- KIRAYA
-- P1.6: payment ledger posting
-- ============================================================


create or replace function kiraya.post_payment_to_ledger(
    p_payment_id uuid,
    p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = kiraya, public
as $$
declare
    v_payment kiraya.payments%rowtype;
    v_entry_id uuid;
begin

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
                message = 'Only posted payments can enter the ledger.';
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where payment_id = p_payment_id
          and entry_type = 'PAYMENT'
          and is_reversal = false
    ) then

        select id
        into v_entry_id
        from kiraya.ledger_entries
        where payment_id = p_payment_id
          and entry_type = 'PAYMENT'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;
    end if;


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
        created_by
    )
    values (
        v_payment.organization_id,
        v_payment.tenant_id,
        v_payment.id,
        'PAYMENT',
        v_payment.payment_date,
        'Payment ' || v_payment.payment_number,
        0,
        v_payment.amount,
        v_payment.currency_code,
        v_payment.payment_number,
        p_created_by
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$$;


revoke all
on function kiraya.post_payment_to_ledger(uuid, uuid)
from public;


comment on function kiraya.post_payment_to_ledger(uuid, uuid) is
    'Posts a posted payment as a tenant ledger credit exactly once.';