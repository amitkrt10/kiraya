-- ============================================================
-- KIRAYA
-- Migration: security deposit summary synchronization
--
-- Purpose:
-- Keeps the security_deposits summary columns synchronized
-- with the immutable transaction history.
-- ============================================================

create or replace function kiraya.sync_security_deposit_summary(
    p_security_deposit_id uuid
)
returns void
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_received numeric(18,2);
    v_deducted numeric(18,2);
    v_refunded numeric(18,2);
    v_outstanding numeric(18,2);
begin

    select
        kiraya.get_security_deposit_received(p_security_deposit_id),
        kiraya.get_security_deposit_deducted(p_security_deposit_id),
        kiraya.get_security_deposit_refunded(p_security_deposit_id)
    into
        v_received,
        v_deducted,
        v_refunded;

    select greatest(
        0,
        required_amount - v_received
    )
    into v_outstanding
    from kiraya.security_deposits
    where id = p_security_deposit_id;

    update kiraya.security_deposits
    set
        received_amount = v_received,
        deducted_amount = v_deducted,
        refunded_amount = v_refunded,
        outstanding_amount = v_outstanding,
        status = case
            when v_received = 0
                then 'PENDING'::kiraya.deposit_status

            when v_received < required_amount
                then 'PARTIALLY_RECEIVED'::kiraya.deposit_status

            when v_received >= required_amount
                then 'RECEIVED'::kiraya.deposit_status

            else status
        end,
        updated_at = now()
    where id = p_security_deposit_id;

end;
$$;


create or replace function kiraya.handle_security_deposit_transaction()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    perform kiraya.sync_security_deposit_summary(
        new.security_deposit_id
    );

    return new;
end;
$$;


drop trigger if exists trg_handle_security_deposit_transaction
on kiraya.security_deposit_transactions;

create trigger trg_handle_security_deposit_transaction
after insert
on kiraya.security_deposit_transactions
for each row
execute function kiraya.handle_security_deposit_transaction();


comment on function kiraya.sync_security_deposit_summary(uuid) is
    'Recalculates the security deposit summary from transaction history.';

comment on function kiraya.handle_security_deposit_transaction() is
    'Synchronizes the security deposit summary after each transaction.';