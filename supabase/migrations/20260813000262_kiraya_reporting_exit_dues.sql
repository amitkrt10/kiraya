-- ============================================================
-- KIRAYA
-- P3.8: exit tenant dues
-- ============================================================


create or replace view kiraya.v_exit_tenant_dues
with (security_invoker = true)
as
select
    es.organization_id,

    es.id as exit_settlement_id,
    es.settlement_code,

    t.id as tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,

    l.id as lease_id,
    l.lease_code,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.id as unit_id,
    u.unit_code,
    u.name as unit_name,

    coalesce(
        kiraya.get_tenant_due(
            t.id
        ),
        0
    ) as outstanding_ledger_due,

    coalesce(
        kiraya.get_tenant_credit(
            t.id
        ),
        0
    ) as tenant_credit,

    coalesce(
        es.total_due_amount,
        0
    ) as exit_due_amount,

    coalesce(
        es.total_deduction_amount,
        0
    ) as security_deposit_deductions,

    coalesce(
        es.amount_payable,
        0
    ) as final_amount_payable,

    case
        when coalesce(
            es.amount_payable,
            0
        ) > 0
            then 'PAYABLE'

        when coalesce(
            es.refund_amount,
            0
        ) > 0
            then 'REFUND'

        else 'SETTLED'
    end as settlement_direction,

    es.status as settlement_status,
    es.settlement_date

from kiraya.exit_settlements es

join kiraya.tenants t
    on t.id = es.tenant_id

join kiraya.leases l
    on l.id = es.lease_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id;