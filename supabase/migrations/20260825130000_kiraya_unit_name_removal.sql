-- ============================================================
-- KIRAYA
-- P6.1-D: remove kiraya.units.name ("Unit Name")
--
-- Purpose:
-- Unit Code (units.unit_code) is already the stable, always-present
-- identifier for a Unit everywhere in the product. units.name was an
-- optional, purely cosmetic label — the P6.1-D dependency audit (using
-- pg_depend against the live catalog, not just grep) found zero
-- functions, triggers, RLS policies, indexes, or financial/billing logic
-- depending on it; only 7 reporting views select it (aliased as
-- unit_name), and none of those alias values are actually consumed by
-- application code today. Confirmed against both the local seed (0/8
-- units named) and the hosted dev database (2/71 named, both synthetic
-- E2E fixtures redundant with their own unit_code) — explicitly approved
-- for removal.
--
-- This does NOT touch the unrelated unit_name columns on
-- kiraya.utilities / kiraya.utility_rates / kiraya.meters /
-- kiraya.bill_items, which store an unrelated "measurement unit" label
-- (e.g. kWh, litre) and share nothing with units.name beyond the name.
--
-- Order matters: the 7 dependent views are recreated first (dropping
-- only their unit_name column, preserving every join/filter/calculation/
-- other alias/security_invoker property unchanged) so the column drop
-- below never needs CASCADE.
-- ============================================================

-- ------------------------------------------------------------
-- v_tenant_outstanding
-- ------------------------------------------------------------
drop view if exists kiraya.v_tenant_outstanding;
create view kiraya.v_tenant_outstanding
with (security_invoker = true)
as
select
    t.id as tenant_id,
    t.organization_id,

    t.tenant_code,
    t.display_name as tenant_name,
    t.phone,

    l.id as lease_id,
    l.lease_code,

    l.unit_id,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.unit_code,

    coalesce(
        kiraya.get_tenant_due(t.id),
        0
    ) as amount_due,

    coalesce(
        kiraya.get_tenant_credit(t.id),
        0
    ) as credit_balance,

    case
        when coalesce(
            kiraya.get_tenant_due(t.id),
            0
        ) > 0
            then 'DUE'

        when coalesce(
            kiraya.get_tenant_credit(t.id),
            0
        ) > 0
            then 'CREDIT'

        else 'SETTLED'
    end as balance_status

from kiraya.tenants t

left join kiraya.leases l
    on l.tenant_id = t.id
   and l.status = 'ACTIVE'

left join kiraya.units u
    on u.id = l.unit_id

left join kiraya.properties p
    on p.id = u.property_id

where t.status = 'ACTIVE';

-- ------------------------------------------------------------
-- v_tenant_milestones
-- ------------------------------------------------------------
drop view if exists kiraya.v_tenant_milestones;
create view kiraya.v_tenant_milestones
with (security_invoker = true)
as
with lease_age as (

    select
        l.organization_id,

        l.id as lease_id,
        l.lease_code,

        t.id as tenant_id,
        t.tenant_code,
        t.display_name as tenant_name,
        t.phone,

        p.id as property_id,
        p.property_code,
        p.name as property_name,

        u.id as unit_id,
        u.unit_code,

        l.occupancy_start_date,
        l.actual_end_date,

        (
            current_date
            - l.occupancy_start_date
        ) as occupancy_days,

        (
            extract(
                year from age(
                    current_date,
                    l.occupancy_start_date
                )
            ) * 12
            +
            extract(
                month from age(
                    current_date,
                    l.occupancy_start_date
                )
            )
        )::integer as completed_months

    from kiraya.leases l

    join kiraya.tenants t
        on t.id = l.tenant_id

    join kiraya.units u
        on u.id = l.unit_id

    join kiraya.properties p
        on p.id = u.property_id

    where l.status = 'ACTIVE'
)

select
    organization_id,

    lease_id,
    lease_code,

    tenant_id,
    tenant_code,
    tenant_name,
    phone,

    property_id,
    property_code,
    property_name,

    unit_id,
    unit_code,

    occupancy_start_date,
    actual_end_date,

    occupancy_days,
    completed_months,

    (
        completed_months > 0
        and completed_months % 11 = 0
    ) as milestone_month,

    case
        when completed_months > 0
         and completed_months % 11 = 0
            then completed_months
        else null
    end as milestone_number

from lease_age;

-- ------------------------------------------------------------
-- v_meter_consumption_trend
-- ------------------------------------------------------------
drop view if exists kiraya.v_meter_consumption_trend;
create view kiraya.v_meter_consumption_trend
with (security_invoker = true)
as
with readings as (

    select
        mr.id as reading_id,

        mr.organization_id,
        mr.meter_id,

        m.meter_code,
        m.meter_type,
        m.unit_id,

        u.unit_code,

        p.id as property_id,
        p.property_code,
        p.name as property_name,

        m.utility_id,
        ut.name as utility_name,

        mr.reading_date,
        mr.reading_value,
        mr.reading_event_type,

        lag(
            mr.reading_value
        ) over (
            partition by mr.meter_id
            order by
                mr.reading_date,
                mr.created_at,
                mr.id
        ) as previous_reading,

        lag(
            mr.reading_event_type
        ) over (
            partition by mr.meter_id
            order by
                mr.reading_date,
                mr.created_at,
                mr.id
        ) as previous_event_type,

        m.multiplier

    from kiraya.meter_readings mr

    join kiraya.meters m
        on m.id = mr.meter_id

    join kiraya.units u
        on u.id = m.unit_id

    join kiraya.properties p
        on p.id = u.property_id

    join kiraya.utilities ut
        on ut.id = m.utility_id
)

select
    reading_id,

    organization_id,
    meter_id,
    meter_code,
    meter_type,

    unit_id,
    unit_code,

    property_id,
    property_code,
    property_name,

    utility_id,
    utility_name,

    reading_date,
    reading_value,

    previous_reading,

    case
        when previous_reading is null
            then null

        when reading_event_type in (
            'METER_RESET',
            'METER_REPLACEMENT'
        )
            then null

        when previous_event_type in (
            'METER_RESET',
            'METER_REPLACEMENT'
        )
            then null

        when reading_value < previous_reading
            then null

        else
            round(
                (
                    reading_value
                    - previous_reading
                ) * multiplier,
                6
            )
    end as consumption,

    reading_event_type

from readings;

-- ------------------------------------------------------------
-- v_tenant_bill_summary
-- ------------------------------------------------------------
drop view if exists kiraya.v_tenant_bill_summary;
create view kiraya.v_tenant_bill_summary
with (security_invoker = true) as
select
    b.organization_id,
    b.id as bill_id, b.bill_number,
    b.tenant_id, t.tenant_code, t.display_name as tenant_name, t.phone,
    b.lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code,
    b.period_start as billing_period_start,
    b.period_end as billing_period_end,
    b.bill_date, b.due_date, b.status,
    b.subtotal, b.discount_amount, b.adjustment_amount,
    b.previous_balance_amount, b.total_amount,
    coalesce(kiraya.get_bill_paid_amount(b.id),0) as paid_amount,
    coalesce(kiraya.get_bill_balance(b.id),0) as balance_amount,
    case when b.status='VOID' then 'VOID'
         when kiraya.get_bill_balance(b.id) <= 0 then 'PAID'
         when kiraya.get_bill_paid_amount(b.id) > 0 then 'PARTIALLY_PAID'
         else 'UNPAID' end as payment_state
from kiraya.bills b
join kiraya.tenants t on t.id=b.tenant_id
left join kiraya.leases l on l.id=b.lease_id
left join kiraya.units u on u.id=b.unit_id
left join kiraya.properties p on p.id=u.property_id;

-- ------------------------------------------------------------
-- v_lease_expiry_alerts
-- ------------------------------------------------------------
drop view if exists kiraya.v_lease_expiry_alerts;
create view kiraya.v_lease_expiry_alerts
with (security_invoker = true)
as
select
    l.organization_id,

    l.id as lease_id,
    l.lease_code,

    t.id as tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,
    t.phone,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.id as unit_id,
    u.unit_code,

    l.agreement_end_date,

    (
        l.agreement_end_date
        - current_date
    ) as days_until_expiry,

    case
        when l.agreement_end_date < current_date
            then 'EXPIRED'

        when l.agreement_end_date <= current_date + 7
            then 'EXPIRING_7_DAYS'

        when l.agreement_end_date <= current_date + 30
            then 'EXPIRING_30_DAYS'

        when l.agreement_end_date <= current_date + 60
            then 'EXPIRING_60_DAYS'

        when l.agreement_end_date <= current_date + 90
            then 'EXPIRING_90_DAYS'

        else 'ACTIVE'
    end as alert_status

from kiraya.leases l

join kiraya.tenants t
    on t.id = l.tenant_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id

where l.status = 'ACTIVE'

  and l.agreement_end_date is not null

  and l.agreement_end_date
      <= current_date + 90;

-- ------------------------------------------------------------
-- v_exit_tenant_statement
-- ------------------------------------------------------------
drop view if exists kiraya.v_exit_tenant_statement;
create view kiraya.v_exit_tenant_statement
with (security_invoker = true) as
select
    es.organization_id,
    es.id as exit_settlement_id,
    es.settlement_reference as settlement_code,
    es.tenant_id, t.tenant_code, t.display_name as tenant_name, t.phone,
    es.lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code,
    l.occupancy_start_date, l.actual_end_date,
    es.settlement_date, es.status as settlement_status,
    coalesce(kiraya.get_tenant_due(es.tenant_id),0) as tenant_due,
    coalesce(kiraya.get_tenant_credit(es.tenant_id),0) as tenant_credit,
    coalesce(sd.required_amount,0) as deposit_required,
    coalesce(sd.received_amount,0) as deposit_received,
    coalesce(sd.deducted_amount,0) as deposit_deducted,
    coalesce(sd.refunded_amount,0) as deposit_refunded,
    greatest(0,coalesce(sd.received_amount,0)-coalesce(sd.deducted_amount,0)-coalesce(sd.refunded_amount,0)) as deposit_held,
    es.previous_dues,
    es.final_charges,
    es.deposit_deduction,
    es.tenant_credit as settlement_credit,
    es.final_amount_due,
    es.final_amount_refundable,
    es.created_at,
    es.finalized_at
from kiraya.exit_settlements es
join kiraya.tenants t on t.id=es.tenant_id
join kiraya.leases l on l.id=es.lease_id
join kiraya.units u on u.id=l.unit_id
join kiraya.properties p on p.id=u.property_id
left join kiraya.security_deposits sd on sd.lease_id=es.lease_id;

-- ------------------------------------------------------------
-- v_exit_tenant_dues
-- ------------------------------------------------------------
drop view if exists kiraya.v_exit_tenant_dues;
create view kiraya.v_exit_tenant_dues
with (security_invoker = true) as
select
    es.organization_id,
    es.id as exit_settlement_id,
    es.settlement_reference as settlement_code,
    t.id as tenant_id, t.tenant_code, t.display_name as tenant_name,
    l.id as lease_id, l.lease_code,
    p.id as property_id, p.property_code, p.name as property_name,
    u.id as unit_id, u.unit_code,
    es.previous_dues,
    es.final_charges,
    es.deposit_deduction,
    es.tenant_credit,
    es.final_amount_due,
    es.final_amount_refundable,
    case when es.final_amount_due > 0 then 'PAYABLE'
         when es.final_amount_refundable > 0 then 'REFUND'
         else 'SETTLED' end as settlement_direction,
    es.status as settlement_status,
    es.settlement_date
from kiraya.exit_settlements es
join kiraya.tenants t on t.id=es.tenant_id
join kiraya.leases l on l.id=es.lease_id
join kiraya.units u on u.id=l.unit_id
join kiraya.properties p on p.id=u.property_id;

-- ------------------------------------------------------------
-- Drop the column itself. No CASCADE: every dependent view above has
-- already been recreated without unit_name, so this is a plain, safe
-- drop. units_name_check (the column's own CHECK constraint) is dropped
-- automatically along with the column.
-- ------------------------------------------------------------
alter table kiraya.units
    drop column name;
