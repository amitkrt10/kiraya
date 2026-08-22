-- P5.8A-R rollback.
--
-- The set-based rewrite in 20260822110000 was found to disagree with the
-- unchanged, trusted kiraya.get_tenant_credit()/get_tenant_due() for 9 of
-- 71 active tenants in organization 5242eace-d8a9-4ccc-8308-eb9e5922f47e,
-- discovered via 20260822111000's direct server-side comparison. The
-- investigation additionally found that get_tenant_due(t.id) and
-- get_tenant_credit(t.id) — two independent calls to the same unmodified,
-- pre-existing functions, evaluated within the same single SQL statement —
-- were BOTH simultaneously nonzero for at least one tenant, which is
-- mathematically impossible for a true snapshot-consistent balance read
-- (due and credit are greatest(0,balance)/greatest(0,-balance) of the same
-- value and must be mutually exclusive). This points to either a genuine
-- bug in the rewritten SQL or live concurrent data mutation on the shared
-- database confounding the comparison — reported, not resolved, in the
-- P5.8A-R report. Per that checkpoint's explicit rule ("any semantic
-- difference is a STOP condition"), this migration restores
-- kiraya.v_organization_dashboard to its exact pre-repair definition and
-- drops the temporary diagnostic function, leaving the database in the
-- same state it was in before this investigation began.

drop function if exists kiraya._debug_tenant_credit_breakdown(uuid);

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
)
select dp.organization_id,dp.period_month,
       coalesce(ps.property_count,0) property_count,coalesce(ps.unit_count,0) unit_count,
       coalesce(ps.occupied_unit_count,0) occupied_unit_count,coalesce(ps.vacant_unit_count,0) vacant_unit_count,
       case when coalesce(ps.unit_count,0)=0 then 0 else round(ps.occupied_unit_count::numeric/ps.unit_count*100,2) end occupancy_percentage,
       coalesce(ts.active_tenant_count,0) active_tenant_count,
       coalesce(bs.billed_amount,0) billed_amount,coalesce(pmt.collected_amount,0) collected_amount,
       greatest(0,coalesce(bs.billed_amount,0)-coalesce(pmt.collected_amount,0)) period_collection_gap,
       case when coalesce(bs.billed_amount,0)=0 then 0 else round(coalesce(pmt.collected_amount,0)/bs.billed_amount*100,2) end collection_percentage,
       coalesce((select sum(greatest(0,kiraya.get_tenant_due(t.id))) from kiraya.tenants t where t.organization_id=dp.organization_id and t.status='ACTIVE'),0) active_tenant_dues,
       coalesce((select sum(greatest(0,kiraya.get_tenant_credit(t.id))) from kiraya.tenants t where t.organization_id=dp.organization_id and t.status='ACTIVE'),0) active_tenant_credits
from dashboard_periods dp
left join property_stats ps on ps.organization_id=dp.organization_id
left join tenant_stats ts on ts.organization_id=dp.organization_id
left join bill_stats bs on bs.organization_id=dp.organization_id and bs.period_month=dp.period_month
left join payment_stats pmt on pmt.organization_id=dp.organization_id and pmt.period_month=dp.period_month;
