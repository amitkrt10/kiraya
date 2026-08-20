-- ============================================================
-- KIRAYA
-- Migration: fix partial payment allocation (P5.2F Finding #2)
--
-- Problem:
-- kiraya.allocate_payment_to_bills() only considered candidate bills
-- with status = 'FINALIZED'. Once a bill received any partial
-- payment, kiraya.sync_bill_payment_status() moved it to
-- 'PARTIALLY_PAID', which permanently removed it from this
-- function's candidate set even though it still had an outstanding
-- balance. Any subsequent payment against that bill posted its
-- PAYMENT ledger entry (money recorded as received) but created zero
-- payment_allocations rows — the bill's balance became permanently
-- stuck outside the normal payment flow.
--
-- Fix:
-- Widen the candidate-bill status filter to include PARTIALLY_PAID
-- alongside FINALIZED — both represent a ledger-posted, still-
-- outstanding obligation. DRAFT (never posted to the ledger, no
-- authoritative total_amount yet), PAID (zero balance by
-- construction), and VOID (no longer a valid obligation; void_bill()
-- refuses to void a bill with any active allocation) remain excluded.
--
-- Every other line of the function — payment locking, POSTED
-- requirement, existing-allocation/idempotency subtraction, tenant/
-- organization match, payment-date cutoff, oldest-first ordering,
-- get_bill_balance()-based allocation amount, and the return value —
-- is byte-identical to the live definition.
--
-- Signature, return type, volatility (volatile), security (invoker,
-- unchanged), owner, and search_path are all unchanged from the
-- live definition; CREATE OR REPLACE preserves existing grants.
-- ============================================================

create or replace function kiraya.allocate_payment_to_bills(p_payment_id uuid)
returns numeric
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_payment kiraya.payments%rowtype;
    v_bill kiraya.bills%rowtype;

    v_remaining numeric(18,2);
    v_bill_balance numeric(18,2);
    v_allocation numeric(18,2);

    v_allocated numeric(18,2) := 0;
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
                message = 'Only posted payments can be allocated.';
    end if;

    v_remaining := v_payment.amount;

    /*
     * Existing allocations are respected.
     */
    select
        v_remaining - coalesce(
            sum(allocated_amount),
            0
        )
    into v_remaining
    from kiraya.payment_allocations
    where payment_id = p_payment_id;

    if v_remaining <= 0 then
        return 0;
    end if;

    /*
     * Oldest unpaid eligible bills first. FINALIZED and
     * PARTIALLY_PAID both represent a still-outstanding,
     * ledger-posted obligation; DRAFT, PAID, and VOID do not.
     */
    for v_bill in
        select b.*
        from kiraya.bills b
        where b.tenant_id = v_payment.tenant_id
          and b.organization_id = v_payment.organization_id
          and b.status in ('FINALIZED', 'PARTIALLY_PAID')
          and b.bill_date <= v_payment.payment_date
          and (
              b.total_amount
              - kiraya.get_bill_paid_amount(b.id)
          ) > 0
        order by
            b.bill_date asc,
            b.created_at asc,
            b.id asc
        for update
    loop

        exit when v_remaining <= 0;

        v_bill_balance :=
            kiraya.get_bill_balance(v_bill.id);

        v_allocation :=
            least(
                v_remaining,
                v_bill_balance
            );

        if v_allocation > 0 then

            insert into kiraya.payment_allocations (
                organization_id,
                payment_id,
                bill_id,
                allocated_amount,
                allocation_date,
                created_at
            )
            values (
                v_payment.organization_id,
                v_payment.id,
                v_bill.id,
                v_allocation,
                v_payment.payment_date,
                now()
            );

            v_remaining :=
                v_remaining - v_allocation;

            v_allocated :=
                v_allocated + v_allocation;

        end if;

    end loop;

    return v_allocated;
end;
$function$;
