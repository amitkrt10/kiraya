-- ============================================================
-- KIRAYA
-- P1.10: security deposit transaction immutability
--
-- Deposit transactions are append-only.
--
-- Corrections must be represented by another transaction.
-- ============================================================


create or replace function kiraya.prevent_security_deposit_transaction_update()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    raise exception
        using
            errcode = '23514',
            message = 'Security deposit transactions are immutable. Create a correcting transaction instead.';

end;
$$;


drop trigger if exists trg_prevent_security_deposit_transaction_update
on kiraya.security_deposit_transactions;

create trigger trg_prevent_security_deposit_transaction_update
before update
on kiraya.security_deposit_transactions
for each row
execute function kiraya.prevent_security_deposit_transaction_update();


create or replace function kiraya.prevent_security_deposit_transaction_delete()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    raise exception
        using
            errcode = '23514',
            message = 'Security deposit transactions cannot be deleted. Create a correcting transaction instead.';

end;
$$;


drop trigger if exists trg_prevent_security_deposit_transaction_delete
on kiraya.security_deposit_transactions;

create trigger trg_prevent_security_deposit_transaction_delete
before delete
on kiraya.security_deposit_transactions
for each row
execute function kiraya.prevent_security_deposit_transaction_delete();