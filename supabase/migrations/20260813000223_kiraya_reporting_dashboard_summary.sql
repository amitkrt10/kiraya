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
