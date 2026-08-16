-- ============================================================
-- KIRAYA
-- P1.2: bill balance calculations
--
-- Bill settlement can come from:
--
--   1. Payment allocations
--   2. Tenant credit applications
--
-- Reversed allocations are excluded.
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
        (
            select sum(pa.allocated_amount)
            from kiraya.payment_allocations pa
            join kiraya.payments p
                on p.id = pa.payment_id
            where pa.bill_id = p_bill_id
              and p.status = 'POSTED'
              and not exists (
                  select 1
                  from kiraya.ledger_entries le
                  where le.payment_allocation_id = pa.id
                    and le.entry_type = 'ALLOCATION_REVERSAL'
                    and le.is_reversal = true
              )
        ),
        0
    )
    +
    coalesce(
        (
            select sum(
                le.debit_amount
            )
            from kiraya.ledger_entries le
            where le.bill_id = p_bill_id
              and le.entry_type = 'CREDIT_APPLICATION'
              and le.is_reversal = false
        ),
        0
    );
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
        round(
            coalesce(b.total_amount, 0)
            -
            kiraya.get_bill_paid_amount(p_bill_id),
            2
        )
    )
    from kiraya.bills b
    where b.id = p_bill_id;
$$;


comment on function kiraya.get_bill_paid_amount(uuid) is
    'Returns payment allocations plus valid tenant-credit applications applied to a bill.';

comment on function kiraya.get_bill_balance(uuid) is
    'Returns the current unpaid balance of a bill after payments and credit applications.';