-- ============================================================
-- KIRAYA
-- P1.8: payment allocation ledger trace
--
-- Every payment allocation gets a corresponding ledger trace.
--
-- This does NOT affect tenant balance.
--
-- It exists so allocation reversals have a precise immutable
-- source entry.
-- ============================================================


create or replace function kiraya.post_payment_allocation_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = kiraya, public
as $$
begin

    if not exists (
        select 1
        from kiraya.ledger_entries le
        where le.payment_allocation_id = new.id
          and le.entry_type = 'PAYMENT_ALLOCATION'
          and le.is_reversal = false
    ) then

        insert into kiraya.ledger_entries (
            organization_id,
            tenant_id,
            lease_id,
            bill_id,
            payment_id,
            payment_allocation_id,
            entry_type,
            entry_date,
            description,
            debit_amount,
            credit_amount,
            currency_code,
            reference_code,
            created_by,
            metadata
        )
        select
            new.organization_id,
            b.tenant_id,
            b.lease_id,
            new.bill_id,
            new.payment_id,
            new.id,
            'PAYMENT_ALLOCATION',
            new.allocation_date,
            'Allocation of payment '
                || p.payment_number
                || ' to bill '
                || b.bill_number,
            0,
            0.01,
            b.currency_code,
            new.id::text,
            null,
            jsonb_build_object(
                'allocated_amount',
                new.allocated_amount
            )
        from kiraya.bills b
        join kiraya.payments p
            on p.id = new.payment_id
        where b.id = new.bill_id;

        /*
         * The allocation trace intentionally uses a nominal
         * 0.01 credit because ledger_entries currently requires
         * one side to be greater than zero.
         *
         * The actual financial amount remains represented by
         * payment and allocation records.
         */
    end if;


    return new;
end;
$$;


drop trigger if exists trg_post_payment_allocation_to_ledger
on kiraya.payment_allocations;

create trigger trg_post_payment_allocation_to_ledger
after insert
on kiraya.payment_allocations
for each row
execute function kiraya.post_payment_allocation_to_ledger();


revoke all
on function kiraya.post_payment_allocation_to_ledger()
from public;


comment on function kiraya.post_payment_allocation_to_ledger() is
    'Creates an immutable trace for a payment allocation.';