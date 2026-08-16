-- ============================================================
-- KIRAYA
-- P1.13: payment posting trigger cleanup
--
-- There must be exactly one payment posting workflow.
--
-- POSTED payment:
--   1. ledger credit
--   2. allocation
-- ============================================================


drop trigger if exists trg_handle_payment_posting
on kiraya.payments;


drop trigger if exists trg_process_posted_payment
on kiraya.payments;


create or replace function kiraya.process_posted_payment()
returns trigger
language plpgsql
security definer
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


create trigger trg_process_posted_payment
after update
on kiraya.payments
for each row
execute function kiraya.process_posted_payment();


revoke all
on function kiraya.process_posted_payment()
from public;


comment on function kiraya.process_posted_payment() is
    'Authoritatively posts and allocates a payment when it becomes POSTED.';