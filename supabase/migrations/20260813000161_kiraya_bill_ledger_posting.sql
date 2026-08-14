-- ============================================================
-- KIRAYA
-- Migration: bill ledger posting
--
-- Purpose:
-- Posts a finalized bill as a DEBIT to the tenant ledger.
--
-- A bill can only be posted once.
-- ============================================================

create or replace function kiraya.post_bill_to_ledger(
    p_bill_id uuid,
    p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_entry_id uuid;
begin

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
                message = 'Only finalized bills can be posted to the ledger.';
    end if;

    if exists (
        select 1
        from kiraya.ledger_entries
        where bill_id = p_bill_id
          and entry_type = 'BILL'
          and is_reversal = false
    ) then
        select id
        into v_entry_id
        from kiraya.ledger_entries
        where bill_id = p_bill_id
          and entry_type = 'BILL'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;
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
        created_by
    )
    values (
        v_bill.organization_id,
        v_bill.tenant_id,
        v_bill.lease_id,
        v_bill.id,
        'BILL',
        v_bill.bill_date,
        'Bill ' || v_bill.bill_number,
        v_bill.total_amount,
        0,
        v_bill.currency_code,
        v_bill.bill_number,
        p_created_by
    )
    returning id into v_entry_id;

    return v_entry_id;
end;
$$;


comment on function kiraya.post_bill_to_ledger(uuid, uuid) is
    'Posts a finalized bill as a tenant ledger debit exactly once.';