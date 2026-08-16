-- ============================================================
-- KIRAYA
-- P1.8: payment reversal model
--
-- The financial ledger contains:
--
--   PAYMENT       → original credit
--   REVERSAL      → reversal of PAYMENT
--
-- Payment allocations are NOT themselves ledger entries.
--
-- Allocation reversal is represented by ledger metadata and
-- bill balance calculation.
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
    select
        coalesce(
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
                      where le.entry_type = 'ALLOCATION_REVERSAL'
                        and le.is_reversal = true
                        and le.metadata ->> 'allocation_id'
                            = pa.id::text
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


comment on function kiraya.get_bill_paid_amount(uuid) is
    'Returns valid payment allocations plus tenant credit applications, excluding reversed allocations.';