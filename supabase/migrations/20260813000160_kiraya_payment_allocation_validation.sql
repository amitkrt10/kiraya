-- ============================================================
-- KIRAYA
-- Migration: payment allocation validation
--
-- Purpose:
-- Prevents allocating more than:
--
--   1. The payment amount.
--   2. The outstanding bill amount.
--
-- This protects the financial ledger from invalid allocations.
-- ============================================================

create or replace function kiraya.validate_payment_allocation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    payment_amount numeric(18,2);
    already_allocated numeric(18,2);
    bill_total numeric(18,2);
    bill_allocated numeric(18,2);
    payment_organization_id uuid;
    bill_organization_id uuid;
begin

    -- --------------------------------------------------------
    -- Payment validation
    -- --------------------------------------------------------

    select
        amount,
        organization_id
    into
        payment_amount,
        payment_organization_id
    from kiraya.payments
    where id = new.payment_id;

    if payment_amount is null then
        raise exception
            using
                errcode = '23503',
                message = 'Payment does not exist.';
    end if;

    if payment_organization_id
       is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Payment allocation organization mismatch.';
    end if;


    select coalesce(
        sum(allocated_amount),
        0
    )
    into already_allocated
    from kiraya.payment_allocations
    where payment_id = new.payment_id
      and id <> new.id;


    if already_allocated + new.allocated_amount > payment_amount then

        raise exception
            using
                errcode = '23514',
                message = 'Payment allocation exceeds payment amount.',
                detail = format(
                    'Payment: %s. Already allocated: %s. New allocation: %s.',
                    payment_amount,
                    already_allocated,
                    new.allocated_amount
                );
    end if;


    -- --------------------------------------------------------
    -- Bill validation
    -- --------------------------------------------------------

    select
        total_amount,
        organization_id
    into
        bill_total,
        bill_organization_id
    from kiraya.bills
    where id = new.bill_id;

    if bill_total is null then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;

    if bill_organization_id
       is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Bill allocation organization mismatch.';
    end if;


    select coalesce(
        sum(allocated_amount),
        0
    )
    into bill_allocated
    from kiraya.payment_allocations
    where bill_id = new.bill_id
      and id <> new.id;


    if bill_allocated + new.allocated_amount > bill_total then

        raise exception
            using
                errcode = '23514',
                message = 'Payment allocation exceeds bill balance.',
                detail = format(
                    'Bill: %s. Already allocated: %s. New allocation: %s.',
                    bill_total,
                    bill_allocated,
                    new.allocated_amount
                );
    end if;

    return new;
end;
$$;


create trigger trg_validate_payment_allocation
before insert or update
on kiraya.payment_allocations
for each row
execute function kiraya.validate_payment_allocation();


comment on function kiraya.validate_payment_allocation() is
    'Ensures payment allocations cannot exceed either the payment or bill amount.';