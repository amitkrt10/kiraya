-- ============================================================
-- KIRAYA
-- Migration: finalize bill
--
-- Purpose:
-- Performs final validation and locks a bill into its
-- historical financial state.
-- ============================================================

create or replace function kiraya.finalize_bill(
    p_bill_id uuid,
    p_finalized_by uuid
)
returns kiraya.bills
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_subtotal numeric(18,2);
    v_total numeric(18,2);
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

    if v_bill.status <> 'DRAFT' then
        raise exception
            using
                errcode = '23514',
                message = 'Only draft bills can be finalized.';
    end if;

    select coalesce(sum(amount), 0)
    into v_subtotal
    from kiraya.bill_items
    where bill_id = p_bill_id;

    v_total :=
        round(
            v_subtotal
            - v_bill.discount_amount
            + v_bill.adjustment_amount
            + v_bill.previous_balance_amount,
            2
        );

    if v_total < 0 then
        v_total := 0;
    end if;

    update kiraya.bills
    set
        subtotal = v_subtotal,
        total_amount = v_total,
        status = 'FINALIZED',
        finalized_at = now(),
        finalized_by = p_finalized_by,
        updated_at = now()
    where id = p_bill_id
    returning * into v_bill;

    return v_bill;
end;
$$;


comment on function kiraya.finalize_bill(uuid, uuid) is
    'Finalizes a draft bill and creates the historical financial snapshot.';