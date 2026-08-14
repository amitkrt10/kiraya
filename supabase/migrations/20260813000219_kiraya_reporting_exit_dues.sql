-- ============================================================
-- KIRAYA
-- Migration: exit tenant dues reporting
-- ============================================================

create or replace view kiraya.v_exit_tenant_dues
with (security_invoker = true)
as
select
    es.organization_id,

    es.id as exit_settlement_id,

    t.id as tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,
    t.phone_number,

    p.id as property_id,
    p.name as property_name,

    u.id as unit_id,
    u.unit_number,

    es.settlement_date,

    es.final_amount_due,

    coalesce(
        sum(
            case
                when le.entry_type = 'PAYMENT'
                    then le.credit_amount
                else 0
            end
        ),
        0
    ) as post_settlement_payments,

    greatest(
        0,
        es.final_amount_due
        -
        coalesce(
            sum(
                case
                    when le.entry_type = 'PAYMENT'
                        then le.credit_amount
                    else 0
                end
            ),
            0
        )
    ) as remaining_exit_due

from kiraya.exit_settlements es

join kiraya.tenants t
    on t.id = es.tenant_id

join kiraya.leases l
    on l.id = es.lease_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id

left join kiraya.ledger_entries le
    on le.tenant_id = es.tenant_id
   and le.entry_date >= es.settlement_date
   and le.is_reversal = false

where es.status = 'FINALIZED'

group by
    es.organization_id,
    es.id,
    t.id,
    t.tenant_code,
    t.full_name,
    t.phone_number,
    p.id,
    p.name,
    u.id,
    u.unit_number,
    es.settlement_date,
    es.final_amount_due;