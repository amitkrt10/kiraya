-- ============================================================
-- KIRAYA
-- P5.8A-R: kiraya.v_organization_dashboard performance repair
--
-- Problem (confirmed live, reproducible):
--   active_tenant_dues/active_tenant_credits were computed via two
--   correlated scalar subqueries per output row, each summing
--   kiraya.get_tenant_due(t.id)/get_tenant_credit(t.id) across every
--   ACTIVE tenant in the organization. Both functions wrap
--   kiraya.get_tenant_balance(), which itself runs two aggregate scans
--   of kiraya.ledger_entries (get_tenant_debit_total/get_tenant_credit_
--   total), each with a correlated NOT EXISTS anti-join against a second
--   self-scan for reversal rows. Because the view has one output row per
--   period_month (not one per organization), this entire per-tenant
--   computation was repeated once per month of billing/payment history —
--   for an organization with 71 active tenants and 4 active months, on
--   the order of ~1,100 separate function-call/ledger-scan round-trips
--   for a single dashboard load. Measured live: ~2.6-3.0s for a single
--   request, and canceling statement due to statement timeout (57014,
--   Supabase's 8s statement_timeout) under just 10 concurrent identical
--   requests — reproduced by the full Playwright suite's concurrent
--   worker load.
--
-- Fix:
--   Replace the two correlated per-row subqueries with a single
--   set-based CTE chain that computes each active tenant's balance
--   exactly once (not once per period_month row), using the identical
--   ledger filtering rules kiraya.get_tenant_debit_total()/
--   get_tenant_credit_total() use today (same entry_type allow-lists,
--   same is_reversal=false + not-yet-reversed exclusion), then
--   aggregates greatest(0,balance)/greatest(0,-balance) per organization
--   and joins that single per-org total into the existing period series.
--
--   kiraya.get_tenant_balance()/get_tenant_due()/get_tenant_credit()/
--   get_tenant_debit_total()/get_tenant_credit_total() are NOT modified
--   by this migration — every other caller of those functions (Tenant
--   Detail, Bill Detail, Apply Credit, Exit Settlement calculation, etc.)
--   is completely unaffected. This migration only changes how the
--   dashboard view computes the same numbers, not the numbers' business
--   rules or any other consumer's path to them.
--
-- Verified semantically identical (live, before vs. after) for both E2E
-- organizations across all period_month rows, including the two changed
-- columns and the six always-flat columns (property/unit/occupancy/
-- tenant counts) that this migration otherwise leaves untouched.
-- ============================================================

create or replace view kiraya.v_organization_dashboard
with (security_invoker = true) as
with property_stats as (
    select p.organization_id,count(distinct p.id) property_count,count(u.id) unit_count,
           count(u.id) filter(where u.status='OCCUPIED') occupied_unit_count,
           count(u.id) filter(where u.status='VACANT') vacant_unit_count
    from kiraya.properties p left join kiraya.units u on u.property_id=p.id
    where p.status='ACTIVE' group by p.organization_id
), tenant_stats as (
    select t.organization_id,count(*) filter(where t.status='ACTIVE') active_tenant_count
    from kiraya.tenants t group by t.organization_id
), bill_stats as (
    select b.organization_id,date_trunc('month',b.bill_date)::date period_month,
           coalesce(sum(b.total_amount) filter(where b.status in('FINALIZED','PARTIALLY_PAID','PAID')),0) billed_amount
    from kiraya.bills b group by b.organization_id,date_trunc('month',b.bill_date)::date
), payment_stats as (
    select p.organization_id,date_trunc('month',p.payment_date)::date period_month,
           coalesce(sum(p.amount),0) collected_amount
    from kiraya.payments p where p.status='POSTED'
    group by p.organization_id,date_trunc('month',p.payment_date)::date
), dashboard_periods as (
    select organization_id,period_month from bill_stats union select organization_id,period_month from payment_stats
),
-- Mirrors kiraya.get_tenant_debit_total() exactly (same entry_type
-- allow-list, same is_reversal=false + not-yet-reversed exclusion via
-- anti-join instead of NOT EXISTS), computed once per tenant via GROUP BY
-- instead of once per (tenant x period_month) via scalar function call.
tenant_debit_totals as (
    select le.tenant_id, sum(le.debit_amount) as debit_total
    from kiraya.ledger_entries le
    left join kiraya.ledger_entries rev
        on rev.reverses_entry_id = le.id
       and rev.is_reversal = true
    where le.entry_type in ('BILL','EXIT_SETTLEMENT','CREDIT_REFUND')
      and le.is_reversal = false
      and rev.id is null
    group by le.tenant_id
),
-- Mirrors kiraya.get_tenant_credit_total() exactly, same reasoning as above.
tenant_credit_totals as (
    select le.tenant_id, sum(le.credit_amount) as credit_total
    from kiraya.ledger_entries le
    left join kiraya.ledger_entries rev
        on rev.reverses_entry_id = le.id
       and rev.is_reversal = true
    where le.entry_type in ('PAYMENT','DEPOSIT_APPLICATION')
      and le.is_reversal = false
      and rev.id is null
    group by le.tenant_id
),
-- Mirrors kiraya.get_tenant_balance() exactly: debit_total - credit_total,
-- computed once per active tenant.
active_tenant_balances as (
    select t.id as tenant_id, t.organization_id,
           coalesce(td.debit_total,0) - coalesce(tc.credit_total,0) as balance
    from kiraya.tenants t
    left join tenant_debit_totals td on td.tenant_id = t.id
    left join tenant_credit_totals tc on tc.tenant_id = t.id
    where t.status = 'ACTIVE'
),
-- Mirrors the original correlated subqueries' aggregation
-- (sum(greatest(0,get_tenant_due/get_tenant_credit)) across a org's
-- active tenants) but computed once per organization, not once per row.
organization_tenant_totals as (
    select organization_id,
           sum(greatest(0,balance)) as active_tenant_dues,
           sum(greatest(0,-balance)) as active_tenant_credits
    from active_tenant_balances
    group by organization_id
)
select dp.organization_id,dp.period_month,
       coalesce(ps.property_count,0) property_count,coalesce(ps.unit_count,0) unit_count,
       coalesce(ps.occupied_unit_count,0) occupied_unit_count,coalesce(ps.vacant_unit_count,0) vacant_unit_count,
       case when coalesce(ps.unit_count,0)=0 then 0 else round(ps.occupied_unit_count::numeric/ps.unit_count*100,2) end occupancy_percentage,
       coalesce(ts.active_tenant_count,0) active_tenant_count,
       coalesce(bs.billed_amount,0) billed_amount,coalesce(pmt.collected_amount,0) collected_amount,
       greatest(0,coalesce(bs.billed_amount,0)-coalesce(pmt.collected_amount,0)) period_collection_gap,
       case when coalesce(bs.billed_amount,0)=0 then 0 else round(coalesce(pmt.collected_amount,0)/bs.billed_amount*100,2) end collection_percentage,
       coalesce(ott.active_tenant_dues,0) active_tenant_dues,
       coalesce(ott.active_tenant_credits,0) active_tenant_credits
from dashboard_periods dp
left join property_stats ps on ps.organization_id=dp.organization_id
left join tenant_stats ts on ts.organization_id=dp.organization_id
left join bill_stats bs on bs.organization_id=dp.organization_id and bs.period_month=dp.period_month
left join payment_stats pmt on pmt.organization_id=dp.organization_id and pmt.period_month=dp.period_month
left join organization_tenant_totals ott on ott.organization_id=dp.organization_id;
