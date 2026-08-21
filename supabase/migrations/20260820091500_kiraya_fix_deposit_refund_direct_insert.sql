-- ============================================================
-- KIRAYA
-- Migration: fix direct REFUND transaction insertion (P5.4B)
--
-- Problem:
-- kiraya.security_deposit_transactions has one INSERT RLS policy for
-- all transaction types, gated only on can_write_organization() --
-- the same broad, ordinary-CRUD-tier check used for RECEIPT and
-- DEDUCTION. Nothing distinguished a REFUND-type row created by the
-- trusted kiraya.process_completed_deposit_refund() trigger from one
-- inserted directly by any org-write client, even with an arbitrary
-- amount, bypassing kiraya.deposit_refunds and its
-- tenant_exit_id/exit_settlement_id linkage entirely -- despite the
-- product model requiring refunds to only ever happen through the
-- Tenant Exit -> Exit Settlement -> deposit_refunds -> COMPLETED flow.
--
-- Fix:
-- Reuse the existing kiraya.financial_context trusted-transaction
-- gate -- the same mechanism kiraya.prevent_finalized_bill_mutation()
-- and kiraya.prevent_posted_payment_mutation() already use for the
-- structurally identical problem (a table where one specific write
-- must only happen through one specific trusted function, not through
-- any RLS-authorized direct client call). kiraya.
-- validate_security_deposit_transaction() (the existing BEFORE INSERT
-- trigger that already enforces the amount-currently-held invariant)
-- gains one additional check: a REFUND-type row requires
-- kiraya.financial_context = '1' in the current transaction.
-- kiraya.process_completed_deposit_refund() sets it immediately before
-- its own INSERT, in the same transaction -- exactly the pattern
-- kiraya.void_bill() and kiraya.reverse_payment() already use.
-- Because set_config(..., is_local => true) is transaction-scoped and
-- a Supabase client can only reach the database through a single
-- RLS-scoped call per request, there is no client-reachable way to
-- set the flag in one request and exploit it in a separate one -- the
-- only way to make it true immediately before the guarded insert is
-- inside kiraya.process_completed_deposit_refund() itself.
--
-- RECEIPT and DEDUCTION are completely unaffected -- the new check is
-- scoped to `new.transaction_type = 'REFUND'` only. The existing
-- amount-currently-held validation, the append-only triggers
-- (prevent_security_deposit_transaction_update/_delete, both
-- untouched), the cached-summary sync, and the deposit/tenant/lease
-- consistency checks are all byte-identical to the live definitions.
--
-- No RLS policy is changed. No SECURITY DEFINER function is
-- introduced -- kiraya.process_completed_deposit_refund() stays
-- SECURITY INVOKER: it already only runs for a caller who was already
-- authorized (via the ordinary can_write_organization()-gated UPDATE
-- on kiraya.deposit_refunds) to complete that refund in the first
-- place, so no privilege elevation is needed here, only a way to mark
-- that authorized write as trusted for the one INSERT it performs.
-- Signature, return type, volatility, security (invoker, unchanged
-- for both functions), owner, and search_path are all unchanged from
-- the live definitions; CREATE OR REPLACE preserves existing grants.
-- ============================================================

create or replace function kiraya.validate_security_deposit_transaction()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
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
     * A REFUND transaction may only be created by the trusted refund
     * -processing path (kiraya.process_completed_deposit_refund()),
     * never inserted directly -- refunds must go through
     * Tenant Exit -> Exit Settlement -> deposit_refunds -> COMPLETED.
     */
    if new.transaction_type = 'REFUND'
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'Security deposit refunds must be processed through the deposit refund workflow.';
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
$function$;


create or replace function kiraya.process_completed_deposit_refund()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
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

            -- Establish the trusted context for this transaction
            -- only, immediately before the one write it authorizes --
            -- the same pattern kiraya.void_bill()/kiraya.
            -- reverse_payment() already use for the structurally
            -- identical append-only-table-write-boundary problem.
            perform set_config('kiraya.financial_context', '1', true);

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
$function$;
