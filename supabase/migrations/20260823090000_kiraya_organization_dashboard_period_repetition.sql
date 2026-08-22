-- ============================================================
-- KIRAYA
-- P5.8B-1: kiraya.v_organization_dashboard — remove period-row
-- repetition of the active-tenant due/credit aggregates.
--
-- Root cause (P5.8B, evidence-based, no EXPLAIN available —
-- confirmed via exact SQL analysis + verified row counts +
-- empirical timing): the view's SELECT list ran two correlated
-- scalar subqueries — sum(greatest(0,get_tenant_due(t.id))) and
-- sum(greatest(0,get_tenant_credit(t.id))) over every ACTIVE
-- tenant — once PER OUTPUT ROW (i.e. once per period_month with
-- billing/payment activity), even though both values are
-- provably identical across every row for a given organization
-- (property/unit/tenant-count columns already exhibit this same
-- flat-across-rows shape; verified live, P5.8B-1 baseline
-- snapshot). For Org A (71 active tenants, 4 active months) this
-- meant ~284 evaluations of each of get_tenant_due()/
-- get_tenant_credit() per dashboard load instead of 71.
--
-- Fix: compute both aggregates in a new CTE, once per
-- organization (GROUP BY organization_id over ACTIVE tenants),
-- then LEFT JOIN that single per-org row into every period row —
-- exactly Option 2 from the P5.8B investigation. This is a
-- REPETITION change only:
--
--   - kiraya.get_tenant_due() and kiraya.get_tenant_credit() are
--     called with the exact same arguments, over the exact same
--     ACTIVE-tenant population, with the exact same greatest(0,
--     ...) clamping and sum() aggregation — untouched, not
--     redefined, not reimplemented.
--   - kiraya.get_tenant_credit()/get_tenant_due()/
--     get_tenant_balance()/get_tenant_debit_total()/
--     get_tenant_credit_total() are not modified by this
--     migration in any way.
--   - Every other column (property/unit/occupancy/tenant counts,
--     billed/collected amounts, collection percentage/gap) is
--     copied verbatim from the prior view definition — untouched.
--   - security_invoker = true is preserved.
--
-- Verified live (P5.8B-1): active_tenant_dues/active_tenant_credits
-- are identical, row for row, before and after this migration,
-- for both E2E organizations.
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
-- New: compute the active-tenant due/credit totals once per
-- organization instead of once per output row. get_tenant_due()/
-- get_tenant_credit() themselves, and the ACTIVE-tenant scoping,
-- and the greatest(0,...) clamping, are byte-identical to what
-- the old correlated subqueries did per row -- only the
-- repetition (per-row vs. per-organization) changes.
organization_tenant_aggregates as (
    select t.organization_id,
           sum(greatest(0, kiraya.get_tenant_due(t.id))) active_tenant_dues,
           sum(greatest(0, kiraya.get_tenant_credit(t.id))) active_tenant_credits
    from kiraya.tenants t
    where t.status = 'ACTIVE'
    group by t.organization_id
)
select dp.organization_id,dp.period_month,
       coalesce(ps.property_count,0) property_count,coalesce(ps.unit_count,0) unit_count,
       coalesce(ps.occupied_unit_count,0) occupied_unit_count,coalesce(ps.vacant_unit_count,0) vacant_unit_count,
       case when coalesce(ps.unit_count,0)=0 then 0 else round(ps.occupied_unit_count::numeric/ps.unit_count*100,2) end occupancy_percentage,
       coalesce(ts.active_tenant_count,0) active_tenant_count,
       coalesce(bs.billed_amount,0) billed_amount,coalesce(pmt.collected_amount,0) collected_amount,
       greatest(0,coalesce(bs.billed_amount,0)-coalesce(pmt.collected_amount,0)) period_collection_gap,
       case when coalesce(bs.billed_amount,0)=0 then 0 else round(coalesce(pmt.collected_amount,0)/bs.billed_amount*100,2) end collection_percentage,
       coalesce(ota.active_tenant_dues,0) active_tenant_dues,
       coalesce(ota.active_tenant_credits,0) active_tenant_credits
from dashboard_periods dp
left join property_stats ps on ps.organization_id=dp.organization_id
left join tenant_stats ts on ts.organization_id=dp.organization_id
left join bill_stats bs on bs.organization_id=dp.organization_id and bs.period_month=dp.period_month
left join payment_stats pmt on pmt.organization_id=dp.organization_id and pmt.period_month=dp.period_month
left join organization_tenant_aggregates ota on ota.organization_id=dp.organization_id;
