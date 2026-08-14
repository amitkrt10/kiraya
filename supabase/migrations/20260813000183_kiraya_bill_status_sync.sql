-- ============================================================
-- KIRAYA
-- Migration: bill status synchronization
--
-- Purpose:
-- Keeps the bill's display status synchronized with payment
-- allocations.
--
-- Important:
-- The ledger remains authoritative.
-- Bill status is a convenient snapshot for the UI.
-- ============================================================

create or replace function kiraya.sync_bill_payment_status(
    p_bill_id uuid
)
returns void
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;
    v_paid numeric(18,2);
begin

    select *
    into v_bill
    from kiraya.bills
    where id = p_bill_id
    for update;

    if not found then
        return;
    end if;


    /*
     * Do not alter historical terminal states.
     */
    if v_bill.status in (
        'DRAFT',
        'VOID'
    ) then
        return;
    end if;


    v_paid :=
        kiraya.get_bill_paid_amount(p_bill_id);


    if v_paid <= 0 then

        update kiraya.bills
        set
            status = 'FINALIZED',
            updated_at = now()
        where id = p_bill_id
          and status <> 'FINALIZED';


    elsif v_paid < v_bill.total_amount then

        update kiraya.bills
        set
            status = 'PARTIALLY_PAID',
            updated_at = now()
        where id = p_bill_id
          and status <> 'PARTIALLY_PAID';


    else

        update kiraya.bills
        set
            status = 'PAID',
            updated_at = now()
        where id = p_bill_id
          and status <> 'PAID';

    end if;

end;
$$;


create or replace function kiraya.handle_bill_payment_allocation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    perform kiraya.sync_bill_payment_status(
        new.bill_id
    );

    return new;
end;
$$;


drop trigger if exists trg_handle_bill_payment_allocation
on kiraya.payment_allocations;

create trigger trg_handle_bill_payment_allocation
after insert
on kiraya.payment_allocations
for each row
execute function kiraya.handle_bill_payment_allocation();


comment on function kiraya.sync_bill_payment_status(uuid) is
    'Synchronizes a bill payment status from its payment allocations.';