-- ============================================================
-- KIRAYA
-- Migration: fix payment reversal bypass (P5.2F Finding #3)
--
-- Problem:
-- kiraya.prevent_posted_payment_mutation() permitted the
-- POSTED -> REVERSED transition on kiraya.payments from any caller
-- authorized by the payments_update RLS policy (can_write_organization),
-- with no requirement that the caller went through
-- kiraya.reverse_payment(). A plain client
-- `payments.update({ status: 'REVERSED' })` succeeded directly,
-- bypassing allocation reversal, ledger reversal, and bill status
-- synchronization entirely -- leaving payments.status = 'REVERSED'
-- while the bill stayed at its prior (e.g. PAID) status with a
-- contradictory nonzero get_bill_balance(), the original
-- payment_allocations row still standing, and no REVERSAL or
-- ALLOCATION_REVERSAL ledger entries ever created.
--
-- A schema-wide search confirms kiraya.reverse_payment() is the only
-- function in the kiraya schema that ever writes kiraya.payments.status,
-- and kiraya.payment_status has exactly two values (POSTED, REVERSED) --
-- so the only legitimate transition is POSTED -> REVERSED, and the only
-- legitimate writer of it is kiraya.reverse_payment().
--
-- Fix:
-- Apply the same trusted-context boundary kiraya.bills already uses
-- (kiraya.prevent_finalized_bill_mutation() gated on
-- kiraya.financial_context, set only by kiraya.void_bill() and
-- kiraya.sync_bill_payment_status(), each immediately before their own
-- guarded UPDATE within the same function invocation). Because
-- set_config(..., is_local => true) scopes the flag to the current
-- transaction, and a Supabase client can only reach the database
-- through a single RLS-scoped .update()/.insert() call or a single
-- named .rpc() call -- never arbitrary multi-statement SQL -- there is
-- no client-reachable way to set the flag in one request and have it
-- still apply to a separate request. The only way to make it true
-- immediately before the guarded write is inside one function body,
-- exactly as kiraya.reverse_payment() now does here.
--
-- kiraya.prevent_posted_payment_mutation() gains one additional check
-- (financial_context required for POSTED -> REVERSED); its existing
-- field-identity checks and the REVERSED-is-immutable branch are
-- unchanged. kiraya.reverse_payment() gains one additional statement
-- (perform set_config(...)) immediately before its existing UPDATE;
-- nothing else about it changes -- it remains SECURITY INVOKER, its
-- authorization path (RLS-scoped row lock, POSTED-only check, ledger
-- lookup, already-reversed check, allocation reversal, ledger reversal)
-- is byte-identical.
--
-- Signature, return type, volatility, security (invoker, unchanged for
-- both functions), owner, and search_path are all unchanged from the
-- live definitions; CREATE OR REPLACE preserves existing grants. No RLS
-- policy is touched.
-- ============================================================

create or replace function kiraya.prevent_posted_payment_mutation()
returns trigger
language plpgsql
security invoker
set search_path to 'kiraya', 'public'
as $$
begin

    if old.status = 'POSTED' then

        if new.status <> 'REVERSED' then
            raise exception
                using
                    errcode = '23514',
                    message = 'Posted payments cannot be edited. Reverse the payment instead.';
        end if;

        if coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then
            raise exception
                using
                    errcode = '23514',
                    message = 'Payment reversal must be performed through kiraya.reverse_payment().';
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


create or replace function kiraya.reverse_payment(p_payment_id uuid, p_reversed_by uuid, p_reason text)
returns uuid
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_payment kiraya.payments%rowtype;
    v_original_entry kiraya.ledger_entries%rowtype;
    v_reversal_id uuid;
begin

    if p_reason is null
       or length(trim(p_reason)) = 0 then
        raise exception
            using
                errcode = '22023',
                message = 'A reason is required to reverse a payment.';
    end if;


    select *
    into v_payment
    from kiraya.payments
    where id = p_payment_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Payment does not exist.';
    end if;


    if v_payment.status <> 'POSTED' then
        raise exception
            using
                errcode = '23514',
                message = 'Only posted payments can be reversed.';
    end if;


    select *
    into v_original_entry
    from kiraya.ledger_entries
    where payment_id = p_payment_id
      and entry_type = 'PAYMENT'
      and is_reversal = false
    order by created_at
    limit 1;


    if not found then
        raise exception
            using
                errcode = '23514',
                message = 'Payment ledger entry does not exist.';
    end if;


    if exists (
        select 1
        from kiraya.ledger_entries
        where reverses_entry_id = v_original_entry.id
    ) then
        raise exception
            using
                errcode = '23514',
                message = 'Payment has already been reversed.';
    end if;


    -- Reverse payment allocations first.
    perform kiraya.reverse_payment_allocations(
        p_payment_id,
        p_reversed_by,
        p_reason
    );


    -- Create accounting reversal via the narrowly-scoped SECURITY
    -- DEFINER helper — kiraya.ledger_entries has no INSERT policy
    -- for any role, so only this already-audited path may write it.
    v_reversal_id := kiraya.post_payment_reversal_ledger_entry(
        v_original_entry.id,
        p_reversed_by,
        p_reason
    );


    -- Establish the trusted context for this transaction only,
    -- immediately before the one write it authorizes — the same
    -- pattern kiraya.void_bill() already uses for the structurally
    -- identical bill-immutability boundary.
    perform set_config('kiraya.financial_context', '1', true);

    update kiraya.payments
    set
        status = 'REVERSED',
        updated_at = now()
    where id = p_payment_id;


    return v_reversal_id;
end;
$function$;
