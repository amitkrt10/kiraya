-- ============================================================
-- KIRAYA
-- Migration: fix tenant balance aggregates (P5.2F Finding #1)
--
-- Problem:
-- kiraya.get_tenant_debit_total() and kiraya.get_tenant_credit_total()
-- were written in the original bootstrap migration
-- (20260813000158_kiraya_tenant_balance_functions.sql), before the
-- ledger's reversal/audit-marker model existed. They naively sum
-- debit_amount / credit_amount across every ledger_entries row for
-- a tenant, with no awareness of entry_type or reversal linkage.
--
-- This double-counts a reversed payment: reversing a payment posts
-- BOTH an ALLOCATION_REVERSAL row (bill-level allocation marker) and
-- a REVERSAL row (payment-level marker, linked via reverses_entry_id)
-- for the same amount. Both landed in the naive debit sum, inflating
-- kiraya.get_tenant_balance() by exactly the reversed amount.
--
-- Every other ledger-consuming function (get_bill_paid_amount,
-- get_tenant_credit, void_bill) already treats ALLOCATION_REVERSAL,
-- REVERSAL, and CREDIT_APPLICATION as audit markers to be consumed
-- via targeted existence/linkage checks, never via a blanket sum.
-- This migration brings the two tenant-aggregate functions in line
-- with that established, already-correct model:
--
--   get_tenant_debit_total  = sum of BILL debits not yet reversed
--   get_tenant_credit_total = sum of PAYMENT credits not yet reversed
--
-- "Not yet reversed" is determined the same way reverse_payment()
-- itself already checks for a prior reversal: the existence of a
-- ledger_entries row with is_reversal = true and
-- reverses_entry_id = <this entry's id>. void_bill()'s bill-reversal
-- entries use the identical linkage, so this also fixes voided bills
-- from netting to the correct debit total by design instead of by
-- coincidence.
--
-- kiraya.get_tenant_balance() itself is unchanged — it still simply
-- subtracts credit total from debit total.
--
-- Signature, return type, volatility (stable), security (invoker,
-- unchanged), owner, and search_path are all unchanged from the
-- live definitions; CREATE OR REPLACE preserves existing grants.
-- ============================================================

create or replace function kiraya.get_tenant_debit_total(p_tenant_id uuid)
returns numeric
language sql
stable
set search_path to 'kiraya', 'public'
as $$
    select coalesce(sum(le.debit_amount), 0)
    from kiraya.ledger_entries le
    where le.tenant_id = p_tenant_id
      and le.entry_type = 'BILL'
      and le.is_reversal = false
      and not exists (
          select 1
          from kiraya.ledger_entries r
          where r.reverses_entry_id = le.id
            and r.is_reversal = true
      );
$$;

create or replace function kiraya.get_tenant_credit_total(p_tenant_id uuid)
returns numeric
language sql
stable
set search_path to 'kiraya', 'public'
as $$
    select coalesce(sum(le.credit_amount), 0)
    from kiraya.ledger_entries le
    where le.tenant_id = p_tenant_id
      and le.entry_type = 'PAYMENT'
      and le.is_reversal = false
      and not exists (
          select 1
          from kiraya.ledger_entries r
          where r.reverses_entry_id = le.id
            and r.is_reversal = true
      );
$$;
