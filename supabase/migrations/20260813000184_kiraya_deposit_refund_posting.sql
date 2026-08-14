-- ============================================================
-- KIRAYA
-- Migration: deposit refund posting
--
-- Purpose:
-- When an actual deposit refund is completed, create the
-- corresponding security deposit transaction.
-- ============================================================

create or replace function kiraya.process_completed_deposit_refund()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin

    if new.status = 'COMPLETED'
       and old.status is distinct from 'COMPLETED' then

        if not exists (
            select 1
            from kiraya.security_deposit_transactions sdt
            where sdt.security_deposit_id =
                new.security_deposit_id
              and sdt.transaction_type = 'REFUND'
              and sdt.metadata ->> 'deposit_refund_id'
                    = new.id::text
        ) then

            insert into kiraya.security_deposit_transactions (
                organization_id,
                security_deposit_id,
                tenant_id,
                lease_id,
                transaction_type,
                transaction_date,
                amount,
                currency_code,
                exit_settlement_id,
                created_by,
                description,
                reference_code,
                metadata
            )
            values (
                new.organization_id,
                new.security_deposit_id,
                new.tenant_id,
                (
                    select lease_id
                    from kiraya.security_deposits
                    where id = new.security_deposit_id
                ),
                'REFUND',
                coalesce(
                    new.refund_date,
                    current_date
                ),
                new.amount,
                new.currency_code,
                new.exit_settlement_id,
                new.processed_by,
                'Security deposit refund',
                coalesce(
                    new.transaction_reference,
                    new.refund_reference
                ),
                jsonb_build_object(
                    'deposit_refund_id',
                    new.id
                )
            );

        end if;

    end if;

    return new;
end;
$$;


drop trigger if exists trg_process_completed_deposit_refund
on kiraya.deposit_refunds;

create trigger trg_process_completed_deposit_refund
after update
on kiraya.deposit_refunds
for each row
execute function kiraya.process_completed_deposit_refund();


comment on function kiraya.process_completed_deposit_refund() is
    'Creates the security deposit REFUND transaction after an actual refund is completed.';