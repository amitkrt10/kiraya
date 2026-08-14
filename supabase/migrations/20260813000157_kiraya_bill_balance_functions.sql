-- ============================================================
-- KIRAYA
-- Migration: bill balance functions
--
-- Purpose:
-- Calculates the current outstanding amount on a bill.
--
-- This is derived from:
--
--   bill.total_amount
--   minus payment allocations
--
-- It does NOT store a mutable "paid amount" on bills.
-- ============================================================

create or replace function kiraya.get_bill_paid_amount(
    p_bill_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(pa.allocated_amount),
        0
    )
    from kiraya.payment_allocations pa
    where pa.bill_id = p_bill_id;
$$;


create or replace function kiraya.get_bill_balance(
    p_bill_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        coalesce(b.total_amount, 0)
        - kiraya.get_bill_paid_amount(b.id)
    )
    from kiraya.bills b
    where b.id = p_bill_id;
$$;


comment on function kiraya.get_bill_paid_amount(uuid) is
    'Returns the total payment amount allocated to a bill.';


comment on function kiraya.get_bill_balance(uuid) is
    'Returns the outstanding unpaid amount of a bill.';