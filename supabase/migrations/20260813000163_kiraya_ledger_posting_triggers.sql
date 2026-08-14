-- ============================================================
-- KIRAYA
-- Migration: ledger posting triggers
--
-- Purpose:
-- Automatically create ledger entries when:
--
--   Bill becomes FINALIZED
--   Payment becomes POSTED
--
-- This keeps financial records synchronized.
-- ============================================================


-- ------------------------------------------------------------
-- Bill trigger
-- ------------------------------------------------------------

create or replace function kiraya.handle_bill_finalization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    if new.status = 'FINALIZED'
       and (
           old.status is distinct from 'FINALIZED'
       ) then

        perform kiraya.post_bill_to_ledger(
            new.id,
            new.finalized_by
        );

    end if;

    return new;
end;
$$;


drop trigger if exists trg_handle_bill_finalization
on kiraya.bills;

create trigger trg_handle_bill_finalization
after update
on kiraya.bills
for each row
execute function kiraya.handle_bill_finalization();


-- ------------------------------------------------------------
-- Payment trigger
-- ------------------------------------------------------------

create or replace function kiraya.handle_payment_posting()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    if new.status = 'POSTED'
       and (
           old.status is distinct from 'POSTED'
       ) then

        perform kiraya.post_payment_to_ledger(
            new.id,
            new.received_by
        );

    end if;

    return new;
end;
$$;


drop trigger if exists trg_handle_payment_posting
on kiraya.payments;

create trigger trg_handle_payment_posting
after update
on kiraya.payments
for each row
execute function kiraya.handle_payment_posting();


comment on function kiraya.handle_bill_finalization() is
    'Automatically posts finalized bills to the tenant ledger.';

comment on function kiraya.handle_payment_posting() is
    'Automatically posts posted payments to the tenant ledger.';