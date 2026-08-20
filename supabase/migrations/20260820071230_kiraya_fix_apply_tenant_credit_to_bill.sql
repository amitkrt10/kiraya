-- ============================================================
-- KIRAYA
-- Migration: fix apply_tenant_credit_to_bill() (P5.3B)
--
-- Problem (three related defects in one capability, investigated
-- and approved together as P5.3B):
--
-- 1. RLS/INSERT gap. kiraya.apply_tenant_credit_to_bill() is
--    SECURITY INVOKER and attempts a direct
--    `insert into kiraya.ledger_entries`, but that table has exactly
--    one RLS policy (SELECT only, ledger_entries_select) -- no
--    INSERT policy exists for any role. Every call fails with
--    "new row violates row-level security policy for table
--    ledger_entries". Architecturally identical to the gap
--    kiraya.reverse_payment() had before its P5.2E repair
--    (kiraya.post_payment_reversal_ledger_entry()).
--
-- 2. Stale bill status. Even once the insert succeeds, the function
--    never calls kiraya.sync_bill_payment_status() -- bills.status
--    (the stored column) would stay wherever it was, contradicting
--    get_bill_balance()/get_bill_paid_amount(), which already
--    correctly account for CREDIT_APPLICATION entries.
--
-- 3. Cross-bill concurrency gap. Available tenant credit is a
--    derived value (kiraya.get_tenant_credit()), not a single
--    lockable balance row. The function only locks the bill being
--    applied to -- two concurrent applications against two
--    *different* bills for the same tenant can both read the same
--    pre-consumption credit and over-apply it.
--
-- Fix:
--
-- A new, narrowly-scoped SECURITY DEFINER helper,
-- kiraya.post_credit_application_to_ledger(), performs the single
-- ledger_entries insert -- same pattern as
-- kiraya.post_payment_reversal_ledger_entry(): fixed search_path,
-- row_security off, an explicit kiraya.can_write_organization()
-- check as the real authorization boundary (never trusting a
-- caller-supplied organization_id/tenant_id), and it re-derives and
-- re-clamps the amount to apply from kiraya.get_tenant_credit()/
-- kiraya.get_bill_balance() itself rather than trusting a
-- pre-computed value from its caller. It also re-validates bill
-- eligibility and re-acquires the tenant-scoped advisory lock
-- described below, so it remains safe if ever called directly,
-- bypassing kiraya.apply_tenant_credit_to_bill(). It does not sync
-- bill status -- that stays the top-level function's
-- responsibility, matching its single, narrow purpose ("write
-- exactly one CREDIT_APPLICATION ledger entry, return its id").
--
-- kiraya.apply_tenant_credit_to_bill() stays SECURITY INVOKER. Its
-- eligibility check changes from `status in ('DRAFT', 'FINALIZED')`
-- to `status in ('FINALIZED', 'PARTIALLY_PAID')` -- DRAFT is removed
-- (it was never actually reachable in practice: a DRAFT bill's
-- total_amount is always 0 until finalize_bill() computes it, so
-- get_bill_balance() was always 0 and the amount-clamp guard already
-- rejected every DRAFT attempt; removing it from the status list
-- just makes that explicit rather than incidental). PARTIALLY_PAID
-- is added so a bill that already received one payment can be
-- brought to PAID via credit too, mirroring the P5.2F repair to
-- kiraya.allocate_payment_to_bills(). PAID and VOID remain rejected.
-- After a successful credit application it calls the existing
-- kiraya.sync_bill_payment_status() (unchanged -- it already manages
-- its own trusted kiraya.financial_context internally, the same way
-- kiraya.reverse_payment_allocations() already calls it after each
-- allocation reversal).
--
-- Concurrency: before computing anything, the top-level function
-- acquires a transaction-scoped Postgres advisory lock keyed on the
-- tenant id, serializing every credit-consuming operation for that
-- tenant regardless of which bill it targets. The lock key is taken
-- directly from the first 16 hex digits (64 bits) of the tenant
-- uuid's own text form, reinterpreted as two signed 32-bit integers
-- for the two-argument pg_advisory_xact_lock(int, int) -- a
-- deterministic slice of the uuid's own entropy, not a reduction
-- through a hash function. Transaction-scoped: released
-- automatically at commit/rollback, never persists across requests,
-- and cannot be set up by one client request and exploited by a
-- separate one (each PostgREST call is its own transaction). The
-- helper re-acquires the identical lock defensively; Postgres
-- advisory locks are reentrant within one session/transaction, so
-- this is a harmless no-op when called through the top-level
-- function and the real protection if the helper is ever called on
-- its own.
--
-- Unchanged, per the approved design: no new ledger entry type
-- (CREDIT_APPLICATION was already correct), no ledger_entries INSERT
-- RLS policy (it stays append-only from normal authenticated
-- clients), no change to get_tenant_credit()/get_tenant_balance()/
-- get_bill_balance()/get_bill_paid_amount()/sync_bill_payment_status(),
-- no credit-application reversal mechanism (deferred, as instructed).
--
-- Grants: kiraya.apply_tenant_credit_to_bill()'s existing ACL is
-- untouched (CREATE OR REPLACE preserves it). The new helper is
-- revoked from PUBLIC and granted EXECUTE to `authenticated` only --
-- the same shape as kiraya.post_payment_reversal_ledger_entry(),
-- required because a SECURITY INVOKER caller's internal call to a
-- SECURITY DEFINER function is privilege-checked against the actual
-- invoking role, not the function owner.
-- ============================================================

create or replace function kiraya.post_credit_application_to_ledger(
    p_bill_id uuid,
    p_amount numeric,
    p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'kiraya', 'public'
set row_security to 'off'
as $function$
declare
    v_bill kiraya.bills%rowtype;
    v_lock_key1 int;
    v_lock_key2 int;
    v_credit numeric(18,2);
    v_bill_balance numeric(18,2);
    v_apply numeric(18,2);
    v_entry_id uuid;
begin

    if p_amount <= 0 then
        raise exception
            using
                errcode = '22003',
                message = 'Credit application amount must be greater than zero.';
    end if;

    -- SECURITY DEFINER already bypasses RLS entirely, so (unlike
    -- SECURITY INVOKER code elsewhere in this schema) this locking
    -- SELECT would not filter by organization access on its own --
    -- the explicit can_write_organization() check below is the real
    -- authorization boundary, matching kiraya.void_bill()'s and
    -- kiraya.post_payment_reversal_ledger_entry()'s established
    -- pattern. organization_id/tenant_id/lease_id/currency are all
    -- read fresh from this row, never trusted from the caller.
    select *
    into v_bill
    from kiraya.bills
    where id = p_bill_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;

    if not kiraya.can_write_organization(v_bill.organization_id) then
        raise exception
            using
                errcode = '42501',
                message = 'Not authorized to apply credit in this organization.';
    end if;

    if v_bill.status not in ('FINALIZED', 'PARTIALLY_PAID') then
        raise exception
            using
                errcode = '23514',
                message = 'Credit cannot be applied to this bill status.';
    end if;

    -- Defense in depth: re-acquire the same tenant-scoped advisory
    -- lock kiraya.apply_tenant_credit_to_bill() already holds when
    -- this helper is called through it. Reentrant within one
    -- transaction, so this is a no-op in that path, and the real
    -- protection against the cross-bill concurrent-credit race if
    -- this helper is ever invoked directly.
    v_lock_key1 := ('x' || substr(replace(v_bill.tenant_id::text, '-', ''), 1, 8))::bit(32)::int;
    v_lock_key2 := ('x' || substr(replace(v_bill.tenant_id::text, '-', ''), 9, 8))::bit(32)::int;
    perform pg_advisory_xact_lock(v_lock_key1, v_lock_key2);

    -- Never trust a pre-computed applied amount from the caller --
    -- re-derive and re-clamp against the current authoritative
    -- values, exactly as kiraya.apply_tenant_credit_to_bill() itself
    -- already did before this repair.
    v_credit := kiraya.get_tenant_credit(v_bill.tenant_id);
    v_bill_balance := kiraya.get_bill_balance(v_bill.id);
    v_apply := least(p_amount, v_credit, v_bill_balance);

    if v_apply <= 0 then
        raise exception
            using
                errcode = '23514',
                message = 'No tenant credit is available to apply.';
    end if;

    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        bill_id,
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
        v_bill.organization_id,
        v_bill.tenant_id,
        v_bill.lease_id,
        v_bill.id,
        'CREDIT_APPLICATION',
        current_date,
        'Tenant credit applied to bill ' || v_bill.bill_number,
        v_apply,
        0,
        v_bill.currency_code,
        v_bill.bill_number,
        p_created_by,
        jsonb_build_object('credit_applied', v_apply)
    )
    returning id into v_entry_id;

    return v_entry_id;
end;
$function$;

revoke all on function kiraya.post_credit_application_to_ledger(uuid, numeric, uuid) from public;
grant execute on function kiraya.post_credit_application_to_ledger(uuid, numeric, uuid) to authenticated;


create or replace function kiraya.apply_tenant_credit_to_bill(p_bill_id uuid, p_amount numeric, p_created_by uuid default null::uuid)
returns uuid
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_bill kiraya.bills%rowtype;
    v_lock_key1 int;
    v_lock_key2 int;
    v_entry_id uuid;
begin

    if p_amount <= 0 then
        raise exception
            using
                errcode = '22003',
                message = 'Credit application amount must be greater than zero.';
    end if;

    select *
    into v_bill
    from kiraya.bills
    where id = p_bill_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;

    if v_bill.status not in ('FINALIZED', 'PARTIALLY_PAID') then
        raise exception
            using
                errcode = '23514',
                message = 'Credit cannot be applied to this bill status.';
    end if;

    -- Serialize every credit-consuming operation for this tenant --
    -- available credit is a derived value with no single row to
    -- lock, so two concurrent applications against different bills
    -- for the same tenant could otherwise both read the same
    -- pre-consumption credit and over-apply. See the helper below
    -- and the migration header comment for the key derivation.
    v_lock_key1 := ('x' || substr(replace(v_bill.tenant_id::text, '-', ''), 1, 8))::bit(32)::int;
    v_lock_key2 := ('x' || substr(replace(v_bill.tenant_id::text, '-', ''), 9, 8))::bit(32)::int;
    perform pg_advisory_xact_lock(v_lock_key1, v_lock_key2);

    v_entry_id := kiraya.post_credit_application_to_ledger(p_bill_id, p_amount, p_created_by);

    perform kiraya.sync_bill_payment_status(p_bill_id);

    return v_entry_id;
end;
$function$;
