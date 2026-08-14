-- ============================================================
-- KIRAYA
-- Migration: payment allocation engine
--
-- Purpose:
-- After a payment is POSTED:
--
--   1. Payment enters tenant ledger as CREDIT.
--   2. Existing tenant bills are allocated oldest-first.
--   3. Any remaining amount stays as tenant credit.
--
-- Historical bills and payments are never modified.
-- ============================================================

create or replace function kiraya.allocate_payment_to_bills(
    p_payment_id uuid
)
returns numeric
language plpgsql
security invoker
set search_path = kiraya, public
as $$
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
     * Oldest unpaid finalized bills first.
     */
    for v_bill in
        select b.*
        from kiraya.bills b
        where b.tenant_id = v_payment.tenant_id
          and b.organization_id = v_payment.organization_id
          and b.status = 'FINALIZED'
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
$$;


comment on function kiraya.allocate_payment_to_bills(uuid) is
    'Allocates a posted payment against the tenant oldest-first and leaves excess as tenant credit.';