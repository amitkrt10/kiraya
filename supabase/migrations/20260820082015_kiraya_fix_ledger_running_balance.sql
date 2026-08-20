-- ============================================================
-- KIRAYA
-- Migration: fix v_tenant_ledger running_balance (P5.3C)
--
-- Problem:
-- kiraya.v_tenant_ledger.running_balance summed every row's raw
-- debit_amount - credit_amount unconditionally, with no awareness
-- that REVERSAL/ALLOCATION_REVERSAL/CREDIT_APPLICATION rows are not
-- independent tenant-level economic movements -- the same class of
-- defect kiraya.get_tenant_debit_total()/get_tenant_credit_total()
-- had before their P5.2F repair, never propagated to this view. A
-- reversed payment's ALLOCATION_REVERSAL and REVERSAL rows both
-- added to the running total, and a P5.3B CREDIT_APPLICATION row
-- added on top of the PAYMENT credit that already recognized that
-- money -- both double-counting. This view is what P5.3A's Ledger
-- screens (/app/ledger and the Tenant Detail Ledger tab) display
-- directly.
--
-- Fix (investigated and approved as P5.3C):
--
-- Only BILL, PAYMENT, and REVERSAL rows contribute their own
-- debit - credit to running_balance; every other entry type
-- (ALLOCATION_REVERSAL, CREDIT_APPLICATION, ADJUSTMENT,
-- EXIT_SETTLEMENT, DEPOSIT_RECEIPT, DEPOSIT_DEDUCTION,
-- DEPOSIT_REFUND) contributes zero. All rows remain visible in the
-- ledger -- only their contribution to the running sum changes.
--
-- REVERSAL rows need no special-casing beyond being included: both
-- reversal-producing paths already store the correct offsetting
-- values on the REVERSAL row itself --
-- post_payment_reversal_ledger_entry() sets debit_amount = the
-- original PAYMENT's credit_amount, and void_bill() swaps
-- debit/credit relative to the original BILL row -- so ordinary
-- debit - credit arithmetic on the REVERSAL row produces the correct
-- offset at its own chronological position, with no reverses_entry_id
-- lookup needed. ALLOCATION_REVERSAL and CREDIT_APPLICATION are
-- excluded because kiraya.get_tenant_balance() never references them
-- either (it only examines BILL/PAYMENT, net of reversal) -- they
-- represent bill-level reallocation of already-recognized money, not
-- new tenant-level movements. ADJUSTMENT and the DEPOSIT_* types are
-- excluded because no function in this schema currently creates them
-- (dead enum values). EXIT_SETTLEMENT is excluded not because it is
-- semantically a marker -- it is a genuine charge, and
-- post_exit_settlement_to_ledger() is live -- but because
-- kiraya.get_tenant_balance() itself does not count it yet (Tenant
-- Exit is not built per the P5.3 inspection). Excluding it here is
-- required for running_balance to agree with the authoritative
-- function today; this is a documented limitation to revisit
-- together when Tenant Exit is implemented, not a fix to
-- get_tenant_balance() itself, which this migration does not touch.
--
-- Verified live (investigation phase, real fixtures, not
-- service_role-seeded): a full payment-reversal chain (BILL 15000,
-- PAYMENT 15000, REVERSAL 15000, ALLOCATION_REVERSAL 15000) and an
-- independent credit-application chain (BILL 1, PAYMENT 5001, BILL
-- 8000, CREDIT_APPLICATION 3000) both produce a final running_balance
-- that matches kiraya.get_tenant_balance() exactly, where the current
-- (unrepaired) view showed 30000 and 6000 respectively instead of the
-- correct 15000 and 3000.
--
-- No table, RLS, function, or grant changes. Column names, order,
-- and types are unchanged (only the running_balance expression's
-- internals change) -- CREATE OR REPLACE VIEW is safe. security_invoker
-- is explicitly restated rather than relied on to carry over
-- implicitly.
-- ============================================================

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
            when le.entry_type in ('BILL', 'PAYMENT', 'REVERSAL')
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
