create or replace view kiraya.v_platform_dashboard
with (security_invoker = true) as
select d.period_month,count(distinct d.organization_id) organization_count,
       sum(d.property_count) property_count,sum(d.unit_count) unit_count,
       sum(d.occupied_unit_count) occupied_unit_count,sum(d.vacant_unit_count) vacant_unit_count,
       sum(d.active_tenant_count) active_tenant_count,sum(d.billed_amount) billed_amount,
       sum(d.collected_amount) collected_amount,sum(d.active_tenant_dues) active_tenant_dues,
       sum(d.active_tenant_credits) active_tenant_credits,
       case when sum(d.billed_amount)=0 then 0 else round(sum(d.collected_amount)/sum(d.billed_amount)*100,2) end collection_percentage,
       case when sum(d.unit_count)=0 then 0 else round(sum(d.occupied_unit_count)::numeric/sum(d.unit_count)*100,2) end occupancy_percentage
from kiraya.v_organization_dashboard d
where kiraya.is_super_admin()
group by d.period_month;
