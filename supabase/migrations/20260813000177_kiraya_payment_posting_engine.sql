-- ============================================================
-- KIRAYA
-- Migration: payment posting engine
--
-- Purpose:
-- Ensures a posted payment:
--
--   1. Creates its tenant ledger credit.
--   2. Gets allocated to outstanding bills.
--
-- Allocation happens after the ledger entry is created.
-- ============================================================

create or replace function kiraya.process_posted_payment()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    if new.status = 'POSTED'
       and old.status is distinct from 'POSTED' then

        perform kiraya.post_payment_to_ledger(
            new.id,
            new.received_by
        );

        perform kiraya.allocate_payment_to_bills(
            new.id
        );

    end if;

    return new;
end;
$$;


drop trigger if exists trg_process_posted_payment
on kiraya.payments;

create trigger trg_process_posted_payment
after update
on kiraya.payments
for each row
execute function kiraya.process_posted_payment();


comment on function kiraya.process_posted_payment() is
    'Posts and allocates a payment when its status changes to POSTED.';