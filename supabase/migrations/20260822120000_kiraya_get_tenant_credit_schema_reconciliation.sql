-- ============================================================
-- KIRAYA
-- P5.8A-G: schema source-of-truth reconciliation for
-- kiraya.get_tenant_credit(uuid)
--
-- This is documentation-only. It changes NOTHING about live
-- behavior — the function body below is reproduced verbatim
-- (byte-for-byte, confirmed via `supabase db dump --linked`)
-- from what is already running in production today.
--
-- Background (P5.8A-F): the committed migration history
-- (20260813000159_kiraya_tenant_credit_functions.sql) has
-- described this function as `greatest(0, -get_tenant_balance
-- (p_tenant_id))` since it was first written. That was never
-- true of the live database — the live function has always
-- computed a different, allocation/unapplied-payment-surplus
-- figure instead (PAYMENT credit, less reversed-payment
-- corrections, less amounts already consumed via
-- payment_allocations and CREDIT_APPLICATION). Exhaustive
-- search across all 207 prior migrations found this exact SQL
-- nowhere else in the repository — the live definition never
-- came from a migration in this repo. How/when it was applied
-- directly to the database is unknown and unrecoverable from
-- available evidence; it is not guessed at here.
--
-- P5.8A-F additionally confirmed this live, allocation-based
-- definition is the one real production code already depends
-- on (kiraya.post_credit_application_to_ledger()'s credit
-- clamp) and is consistent with the approved Handoff Spec's
-- own description of "Available Credit" (shown precisely when
-- a tenant has both an outstanding bill and available credit
-- at once) — i.e. this is the product-correct definition, and
-- the migration file was the party out of sync with reality,
-- not the database.
--
-- This migration exists solely so that a fresh database built
-- from this repository's migrations would end up with the same
-- kiraya.get_tenant_credit() the live database already has.
-- kiraya.get_tenant_due()/get_tenant_balance()/
-- get_tenant_debit_total()/get_tenant_credit_total() are not
-- touched — confirmed (P5.8A-F, re-confirmed here) that all
-- four already match their committed migration definitions
-- exactly.
-- ============================================================

create or replace function kiraya.get_tenant_credit(
    p_tenant_id uuid
)
returns numeric
language sql
stable
set search_path = kiraya, public
as $$
    select greatest(
        0,
        coalesce((
            select sum(le.credit_amount)
            from kiraya.ledger_entries le
            where le.tenant_id = p_tenant_id
              and le.entry_type = 'PAYMENT'
              and le.is_reversal = false
        ), 0)
        - coalesce((
            select sum(le.debit_amount)
            from kiraya.ledger_entries le
            where le.tenant_id = p_tenant_id
              and le.entry_type = 'REVERSAL'
              and le.is_reversal = true
              and le.payment_id is not null
        ), 0)
        - coalesce((
            select sum(pa.allocated_amount)
            from kiraya.payment_allocations pa
            join kiraya.payments p on p.id = pa.payment_id
            where p.tenant_id = p_tenant_id
              and p.status = 'POSTED'
              and not exists (
                  select 1
                  from kiraya.ledger_entries r
                  where r.entry_type = 'ALLOCATION_REVERSAL'
                    and r.is_reversal = true
                    and r.metadata->>'allocation_id' = pa.id::text
              )
        ), 0)
        - coalesce((
            select sum(le.debit_amount)
            from kiraya.ledger_entries le
            where le.tenant_id = p_tenant_id
              and le.entry_type = 'CREDIT_APPLICATION'
              and le.is_reversal = false
        ), 0)
    );
$$;


comment on function kiraya.get_tenant_credit(uuid) is
    'Returns available tenant credit created by overpayments or other credits.';
