-- P5.7F Migration D — Pool A (credit-origin) refund processing.
--
-- Mirrors kiraya.process_completed_deposit_refund()'s established, idempotent,
-- AFTER-UPDATE-only pattern exactly, but posts a CREDIT_REFUND ledger entry instead of
-- a security_deposit_transactions row — Pool A must never touch the deposit subledger
-- (P5.7E-LOCK §7).

create or replace function kiraya.post_credit_refund_to_ledger(p_credit_refund_id uuid, p_created_by uuid default null::uuid)
returns uuid
language plpgsql
security definer
set search_path to 'kiraya', 'public'
as $function$
declare
    v_refund kiraya.tenant_credit_refunds%rowtype;
    v_lease_id uuid;
    v_entry_id uuid;
begin

    select *
    into v_refund
    from kiraya.tenant_credit_refunds
    where id = p_credit_refund_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Credit refund does not exist.';
    end if;

    if not kiraya.can_write_organization(v_refund.organization_id) then
        raise exception
            using
                errcode = '42501',
                message = 'Not authorized to post this credit refund.';
    end if;

    if v_refund.status <> 'COMPLETED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only completed credit refunds can be posted.';
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where credit_refund_id = p_credit_refund_id
          and entry_type = 'CREDIT_REFUND'
          and is_reversal = false
    ) then

        select id
        into v_entry_id
        from kiraya.ledger_entries
        where credit_refund_id = p_credit_refund_id
          and entry_type = 'CREDIT_REFUND'
          and is_reversal = false
        order by created_at
        limit 1;

        return v_entry_id;

    end if;


    select lease_id
    into v_lease_id
    from kiraya.exit_settlements
    where id = v_refund.exit_settlement_id;


    -- Debit-only: paying out a credit-origin surplus brings the tenant's
    -- balance back up by exactly that amount (the mirror image of the
    -- PAYMENT credit that created the surplus in the first place).
    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        exit_settlement_id,
        credit_refund_id,
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
    values (
        v_refund.organization_id,
        v_refund.tenant_id,
        v_lease_id,
        v_refund.exit_settlement_id,
        v_refund.id,
        'CREDIT_REFUND',
        coalesce(v_refund.refund_date, current_date),
        'Tenant credit refund ' || v_refund.refund_reference,
        v_refund.amount,
        0,
        v_refund.currency_code,
        v_refund.refund_reference,
        p_created_by,
        '{}'::jsonb
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$function$;

comment on function kiraya.post_credit_refund_to_ledger(uuid, uuid) is
  'P5.7F: SECURITY DEFINER (ledger_entries has zero client INSERT policy). Debit-only — '
  'reduces the tenant''s credit surplus by exactly the amount actually paid out. Never '
  'creates or references anything in the security deposit subledger (Pool A/B separation, '
  'P5.7E-LOCK §7).';

create or replace function kiraya.process_completed_credit_refund()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
begin

    if new.status = 'COMPLETED'
       and old.status is distinct from 'COMPLETED' then

        if not exists (
            select 1
            from kiraya.ledger_entries
            where credit_refund_id = new.id
              and entry_type = 'CREDIT_REFUND'
              and is_reversal = false
        ) then

            perform kiraya.post_credit_refund_to_ledger(
                new.id,
                new.processed_by
            );

        end if;

    end if;

    return new;
end;
$function$;

comment on function kiraya.process_completed_credit_refund() is
  'P5.7F: mirrors kiraya.process_completed_deposit_refund()''s established idempotent, '
  'AFTER-UPDATE-only pattern exactly — the refund record is inserted PENDING, then a '
  'separate update to COMPLETED triggers the one, idempotent ledger post.';

create trigger trg_process_completed_credit_refund
  after update on kiraya.tenant_credit_refunds
  for each row execute function kiraya.process_completed_credit_refund();
