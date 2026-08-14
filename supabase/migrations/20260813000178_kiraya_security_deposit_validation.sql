-- ============================================================
-- KIRAYA
-- Migration: security deposit transaction validation
--
-- Purpose:
-- Ensures deposit transactions belong to the same:
--
--   organization
--   tenant
--   lease
--   security deposit
--
-- Also prevents deductions/refunds from exceeding the amount
-- currently held.
-- ============================================================

create or replace function kiraya.validate_security_deposit_transaction()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_deposit kiraya.security_deposits%rowtype;

    v_received numeric(18,2);
    v_deducted numeric(18,2);
    v_refunded numeric(18,2);

    v_available numeric(18,2);
begin

    select *
    into v_deposit
    from kiraya.security_deposits
    where id = new.security_deposit_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Security deposit does not exist.';
    end if;


    if v_deposit.organization_id
       is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Security deposit organization mismatch.';
    end if;


    if v_deposit.tenant_id
       is distinct from new.tenant_id then

        raise exception
            using
                errcode = '23514',
                message = 'Security deposit tenant mismatch.';
    end if;


    if v_deposit.lease_id
       is distinct from new.lease_id then

        raise exception
            using
                errcode = '23514',
                message = 'Security deposit lease mismatch.';
    end if;


    /*
     * Calculate the amount currently held BEFORE this
     * transaction.
     */
    select
        coalesce(
            sum(
                case
                    when transaction_type = 'RECEIPT'
                        then amount
                    else 0
                end
            ),
            0
        ),
        coalesce(
            sum(
                case
                    when transaction_type = 'DEDUCTION'
                        then amount
                    else 0
                end
            ),
            0
        ),
        coalesce(
            sum(
                case
                    when transaction_type = 'REFUND'
                        then amount
                    else 0
                end
            ),
            0
        )
    into
        v_received,
        v_deducted,
        v_refunded
    from kiraya.security_deposit_transactions
    where security_deposit_id = new.security_deposit_id
      and id <> new.id;


    v_available :=
        greatest(
            0,
            v_received
            - v_deducted
            - v_refunded
        );


    /*
     * A deduction or refund cannot exceed the deposit
     * currently held.
     */
    if new.transaction_type in (
        'DEDUCTION',
        'REFUND'
    )
    and new.amount > v_available then

        raise exception
            using
                errcode = '23514',
                message = 'Security deposit transaction exceeds amount currently held.',
                detail = format(
                    'Available deposit: %s. Requested transaction: %s.',
                    v_available,
                    new.amount
                );
    end if;


    return new;
end;
$$;


drop trigger if exists trg_validate_security_deposit_transaction
on kiraya.security_deposit_transactions;

create trigger trg_validate_security_deposit_transaction
before insert or update
on kiraya.security_deposit_transactions
for each row
execute function kiraya.validate_security_deposit_transaction();


comment on function kiraya.validate_security_deposit_transaction() is
    'Validates security deposit ownership and prevents deductions/refunds beyond the held amount.';