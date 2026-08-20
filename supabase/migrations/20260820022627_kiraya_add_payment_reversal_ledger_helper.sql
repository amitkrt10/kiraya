-- ============================================================
-- KIRAYA
-- Financial integrity: narrowly-scoped SECURITY DEFINER helper for
-- the payment-reversal ledger write
--
-- Root cause (P5.2E inspection, confirmed via a live reproduction
-- immediately after 20260820021455_kiraya_fix_reverse_payment_locking.sql):
--
-- kiraya.reverse_payment() is, and must remain, SECURITY INVOKER.
-- Partway through its work it calls kiraya.reverse_payment_allocations()
-- (SECURITY DEFINER) — but that elevation applies only for the
-- duration of that nested call. Once it returns, reverse_payment()
-- resumes under its own (invoker) context for its final step:
-- `insert into kiraya.ledger_entries (...)` for the REVERSAL entry.
-- kiraya.ledger_entries has no INSERT policy for any role — by
-- design, only privileged, already-audited paths
-- (post_payment_to_ledger(), post_bill_to_ledger(), void_bill())
-- may ever write to it — so that insert is rejected under RLS for
-- any ordinary authenticated caller. Reproduced live: after the
-- previous migration's fix, the ledger lookup succeeded, but the
-- reversal failed with "new row violates row-level security policy
-- for table ledger_entries". The payment/ledger/allocation/bill
-- state were all confirmed unchanged after the failed attempt —
-- reverse_payment() failed atomically, no partial state.
--
-- Fix: add kiraya.post_payment_reversal_ledger_entry(), a narrowly
-- scoped SECURITY DEFINER helper whose only job is to create the
-- REVERSAL ledger entry for an already-identified original PAYMENT
-- entry, following the exact same established convention as
-- kiraya.void_bill() (which does the analogous thing for voided
-- bills' ledger reversal): SECURITY DEFINER, fixed search_path,
-- row_security off for its own reads, and — because SECURITY
-- DEFINER already bypasses RLS entirely (owner is a superuser), the
-- implicit "SELECT ... FOR UPDATE against an RLS-protected table
-- silently filters rows the caller can't write to" pattern used
-- elsewhere in this schema does NOT provide authorization inside a
-- DEFINER context — so, exactly like void_bill(), this helper
-- performs its own explicit kiraya.can_write_organization() check
-- rather than relying on locking semantics that don't apply here.
--
-- The helper does not accept any financial value from its caller —
-- only a reference (the original ledger entry's id), who performed
-- the reversal, and why. Every financial field written (organization,
-- tenant, payment, amounts, currency) is derived from the existing,
-- already-posted original ledger entry and its payment row, never
-- taken as a caller-supplied parameter. It independently re-verifies
-- that the referenced entry is a real, non-reversed, payment-linked
-- PAYMENT entry, that the caller may write to its organization, and
-- that no reversal already exists for it — so calling this helper
-- directly (bypassing reverse_payment()) is exactly as safe as
-- calling it through reverse_payment(), not a new bypass route.
--
-- kiraya.reverse_payment() changes in exactly one place: its direct
-- `insert into kiraya.ledger_entries (...)` is replaced with a call
-- to this helper. It remains SECURITY INVOKER. Every other check
-- (reason required, payment row FOR UPDATE + found + POSTED status,
-- original-entry lookup without FOR UPDATE per the previous
-- migration, the already-reversed guard, allocation reversal,
-- the final payment status update) is byte-for-byte unchanged.
--
-- kiraya.ledger_entries RLS is untouched — no INSERT/UPDATE/DELETE
-- policy is added. This helper remains the only write path for
-- REVERSAL entries, exactly as intended.
-- ============================================================

create or replace function kiraya.post_payment_reversal_ledger_entry(
    p_original_entry_id uuid,
    p_reversed_by uuid,
    p_reason text
)
returns uuid
language plpgsql
security definer
set search_path to 'kiraya', 'public'
set row_security to 'off'
as $$
declare
    v_original kiraya.ledger_entries%rowtype;
    v_payment kiraya.payments%rowtype;
    v_reversal_id uuid;
begin

    if p_reason is null or length(trim(p_reason)) = 0 then
        raise exception
            using
                errcode = '22023',
                message = 'A reason is required to reverse a payment.';
    end if;

    select *
    into v_original
    from kiraya.ledger_entries
    where id = p_original_entry_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Ledger entry does not exist.';
    end if;

    if v_original.entry_type <> 'PAYMENT'
       or v_original.is_reversal
       or v_original.payment_id is null then
        raise exception
            using
                errcode = '23514',
                message = 'Only an original payment ledger entry can be reversed.';
    end if;

    -- SECURITY DEFINER already bypasses RLS entirely, so (unlike
    -- SECURITY INVOKER code elsewhere in this schema) a locking
    -- SELECT here would not filter by organization access — this
    -- explicit check is the real authorization boundary, matching
    -- kiraya.void_bill()'s established pattern.
    if not kiraya.can_write_organization(v_original.organization_id) then
        raise exception
            using
                errcode = '42501',
                message = 'Not authorized to reverse payments in this organization.';
    end if;

    select *
    into v_payment
    from kiraya.payments
    where id = v_original.payment_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Payment does not exist.';
    end if;

    if exists (
        select 1
        from kiraya.ledger_entries
        where reverses_entry_id = v_original.id
    ) then
        raise exception
            using
                errcode = '23514',
                message = 'Payment has already been reversed.';
    end if;

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
        v_original.organization_id,
        v_original.tenant_id,
        v_original.payment_id,
        'REVERSAL',
        current_date,
        'Reversal of payment '
            || v_payment.payment_number
            || ': '
            || trim(p_reason),
        v_original.credit_amount,
        0,
        v_original.currency_code,
        v_payment.payment_number,
        true,
        v_original.id,
        p_reversed_by,
        jsonb_build_object(
            'reason', trim(p_reason)
        )
    )
    returning id into v_reversal_id;

    return v_reversal_id;
end;
$$;

revoke all on function kiraya.post_payment_reversal_ledger_entry(uuid, uuid, text) from public;


-- ------------------------------------------------------------
-- reverse_payment(): unchanged except the final ledger insert now
-- goes through the helper above. Remains LANGUAGE plpgsql with no
-- SECURITY DEFINER clause (SECURITY INVOKER).
-- ------------------------------------------------------------

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


    update kiraya.payments
    set
        status = 'REVERSED',
        updated_at = now()
    where id = p_payment_id;


    return v_reversal_id;
end;
$function$
;
