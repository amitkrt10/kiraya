-- ============================================================
-- KIRAYA
-- Migration: EXIT_SETTLEMENT tenant balance/ledger visibility
-- (P5.4D Defect #4 -- product decision: EXIT_SETTLEMENT is a real,
-- collectible tenant debt)
--
-- Problem:
-- kiraya.post_exit_settlement_to_ledger() posts a real
-- EXIT_SETTLEMENT debit to ledger_entries, but
-- kiraya.get_tenant_debit_total() only ever summed entry_type =
-- 'BILL', and kiraya.v_tenant_ledger.running_balance (P5.3C) only
-- ever counted BILL/PAYMENT/REVERSAL rows -- both by explicit,
-- documented design at the time, because Tenant Exit did not exist
-- yet. That gap is now closed by product decision.
--
-- Fix:
-- get_tenant_debit_total() now also sums entry_type =
-- 'EXIT_SETTLEMENT' rows, under the identical is_reversal/no-
-- existing-reversal condition already applied to BILL rows (no
-- reversal mechanism exists for EXIT_SETTLEMENT today; the
-- condition is kept for correctness if one is ever added, at no
-- cost to current behavior). get_tenant_credit_total() is
-- unchanged -- EXIT_SETTLEMENT entries only ever have
-- credit_amount = 0 (post_exit_settlement_to_ledger() never sets
-- it), so there is nothing to add there. get_tenant_balance()
-- itself is unchanged (still simply debit_total - credit_total),
-- and therefore now correctly includes EXIT_SETTLEMENT by
-- construction, matching get_tenant_due()/get_tenant_credit() and
-- every view built on top of them (including the existing exit-
-- statement reporting views).
--
-- v_tenant_ledger.running_balance now also counts EXIT_SETTLEMENT
-- rows the same way it already counts BILL/PAYMENT/REVERSAL
-- (debit_amount - credit_amount at that row's chronological
-- position) -- consistent with post_exit_settlement_to_ledger()
-- only ever setting debit_amount, never credit_amount.
--
-- IMPORTANT -- explicitly NOT done here, per instruction:
-- no payment-allocation mechanism for EXIT_SETTLEMENT debt is
-- created by this migration. Inspection (allocate_payment_to_
-- bills(), payment_allocations.bill_id NOT NULL FK to bills only,
-- apply_tenant_credit_to_bill()/post_credit_application_to_ledger()
-- both bill-only) found no existing authoritative mechanism to
-- allocate a specific payment against an EXIT_SETTLEMENT ledger
-- entry -- reported separately in the P5.4D Backend Repair Report,
-- as instructed, not solved here. A payment recorded after this
-- migration still nets correctly against the tenant's aggregate
-- balance (get_tenant_balance() is pure arithmetic over debit/
-- credit totals, needs no entry-level link to net correctly) --
-- it simply cannot be traced to "this payment settled that exit
-- debt" the way payment_allocations traces payments to bills.
--
-- Signature, return type, volatility, security mode, owner, and
-- search_path are unchanged for get_tenant_debit_total(). Column
-- names, order, and types are unchanged for v_tenant_ledger; only
-- the running_balance expression's entry_type list changes.
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
      and le.entry_type in ('BILL', 'EXIT_SETTLEMENT')
      and le.is_reversal = false
      and not exists (
          select 1
          from kiraya.ledger_entries r
          where r.reverses_entry_id = le.id
            and r.is_reversal = true
      );
$$;


create or replace view kiraya.v_tenant_ledger
with (security_invoker = true)
as
select
    le.organization_id,
    le.id as ledger_entry_id,
    le.tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,
    le.lease_id,
    l.lease_code,
    le.bill_id,
    b.bill_number,
    le.payment_id,
    pay.payment_number,
    le.entry_type,
    le.entry_date,
    le.description,
    coalesce(le.debit_amount, 0::numeric) as debit_amount,
    coalesce(le.credit_amount, 0::numeric) as credit_amount,
    le.currency_code,
    le.reference_code,
    le.is_reversal,
    le.reverses_entry_id,
    le.created_at,
    sum(
        case
            when le.entry_type in ('BILL', 'PAYMENT', 'REVERSAL', 'EXIT_SETTLEMENT')
            then coalesce(le.debit_amount, 0::numeric) - coalesce(le.credit_amount, 0::numeric)
            else 0::numeric
        end
    ) over (
        partition by le.tenant_id
        order by le.entry_date, le.created_at, le.id
        rows between unbounded preceding and current row
    ) as running_balance
from kiraya.ledger_entries le
    join kiraya.tenants t on t.id = le.tenant_id
    left join kiraya.leases l on l.id = le.lease_id
    left join kiraya.bills b on b.id = le.bill_id
    left join kiraya.payments pay on pay.id = le.payment_id;
