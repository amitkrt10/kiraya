-- ============================================================
-- KIRAYA
-- Financial integrity: reverse_payment() must not lock a row it
-- cannot see through a locking SELECT
--
-- Root cause (P5.2E inspection, confirmed via a live reproduction
-- against the linked project immediately after the payment-insert
-- trigger fix, not guessed):
--
-- kiraya.reverse_payment() looks up the original PAYMENT ledger
-- entry with:
--
--   select * into v_original_entry
--   from kiraya.ledger_entries
--   where payment_id = p_payment_id
--     and entry_type = 'PAYMENT'
--     and is_reversal = false
--   order by created_at limit 1
--   for update;
--
-- kiraya.ledger_entries has only a SELECT row-level-security policy
-- (ledger_entries_select) — there is no UPDATE (or DELETE) policy on
-- it at all, by design (only privileged, already-audited SECURITY
-- DEFINER paths such as post_payment_to_ledger()/void_bill() may
-- ever write to it). Per PostgreSQL's documented RLS behavior, a
-- locking SELECT (FOR UPDATE/FOR SHARE) additionally requires the
-- row to satisfy an UPDATE policy for the querying role — with none
-- defined, the row is silently excluded from the locked result set,
-- even though it is plainly visible to a non-locking SELECT under
-- the exact same session. Reproduced live: an authenticated
-- E2E_ORG_A session could SELECT the row directly, but the same
-- query with FOR UPDATE returned zero rows under that session. A
-- control query against kiraya.bills (which does have an UPDATE
-- policy) found its row correctly with FOR UPDATE under the same
-- pattern, confirming the cause. reverse_payment() then reports the
-- misleading "Payment ledger entry does not exist." for a payment
-- that has, in fact, been correctly posted.
--
-- Fix: remove only the FOR UPDATE clause from this one lookup. It
-- is redundant for concurrency: reverse_payment() already locks the
-- kiraya.payments row first (`select * from kiraya.payments where
-- id = p_payment_id for update`), and kiraya.payments DOES carry a
-- real UPDATE policy (payments_update), so that lock alone already
-- serializes any two concurrent reverse_payment() calls for the
-- same payment — the second caller blocks on the payments row lock
-- until the first transaction commits or rolls back, by which point
-- the payment's status is already 'REVERSED' and the second call's
-- own `if v_payment.status <> 'POSTED'` check rejects it. No
-- additional lock on ledger_entries is needed to prevent a double
-- reversal.
--
-- Nothing else changes: authorization checks, the payment row lock,
-- how the original entry is identified (same WHERE clause, same
-- ORDER BY/LIMIT), the already-reversed guard, allocation reversal,
-- reversal ledger-entry creation, and the final payment status
-- update are all byte-for-byte identical to
-- 20260813000232_kiraya_payment_reversal.sql /
-- 20260813000271_kiraya_financial_reversal_repair.sql. This
-- function remains LANGUAGE plpgsql with no SECURITY DEFINER clause
-- — its authorization model (and kiraya.ledger_entries' RLS) is
-- unchanged.
-- ============================================================

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


    -- Create accounting reversal.
    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        payment_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        is_reversal,
        reverses_entry_id,
        created_by,
        metadata
    )
    values (
        v_original_entry.organization_id,
        v_original_entry.tenant_id,
        v_original_entry.payment_id,
        'REVERSAL',
        current_date,
        'Reversal of payment '
            || v_payment.payment_number
            || ': '
            || trim(p_reason),
        v_original_entry.credit_amount,
        0,
        v_original_entry.currency_code,
        v_payment.payment_number,
        true,
        v_original_entry.id,
        p_reversed_by,
        jsonb_build_object(
            'reason', trim(p_reason)
        )
    )
    returning id into v_reversal_id;


    update kiraya.payments
    set
        status = 'REVERSED',
        updated_at = now()
    where id = p_payment_id;


    return v_reversal_id;
end;
$function$
;
