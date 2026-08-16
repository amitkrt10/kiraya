-- ============================================================
-- KIRAYA
-- P1.12: posted payment immutability
--
-- Payment correction is performed through reversal.
-- ============================================================


create or replace function kiraya.prevent_posted_payment_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    if old.status = 'POSTED' then

        if new.status <> 'REVERSED' then
            raise exception
                using
                    errcode = '23514',
                    message = 'Posted payments cannot be edited. Reverse the payment instead.';
        end if;

        /*
         * These financial identity fields must never change
         * during reversal.
         */
        if new.amount is distinct from old.amount
           or new.tenant_id is distinct from old.tenant_id
           or new.organization_id is distinct from old.organization_id
           or new.payment_date is distinct from old.payment_date
           or new.payment_method_id is distinct from old.payment_method_id then

            raise exception
                using
                    errcode = '23514',
                    message = 'Payment financial details cannot change during reversal.';
        end if;

    end if;


    if old.status = 'REVERSED' then

        raise exception
            using
                errcode = '23514',
                message = 'Reversed payments are immutable.';
    end if;


    return new;
end;
$$;


drop trigger if exists trg_prevent_posted_payment_mutation
on kiraya.payments;

create trigger trg_prevent_posted_payment_mutation
before update
on kiraya.payments
for each row
execute function kiraya.prevent_posted_payment_mutation();