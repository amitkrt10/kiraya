-- ============================================================
-- KIRAYA
-- P3.7: exit tenant statement
-- ============================================================


create or replace view kiraya.v_exit_tenant_statement
with (security_invoker = true)
as
select
    es.organization_id,

    es.id as exit_settlement_id,
    es.settlement_code,

    es.tenant_id,
    t.tenant_code,
    t.display_name as tenant_name,
    t.phone,

    es.lease_id,
    l.lease_code,

    p.id as property_id,
    p.property_code,
    p.name as property_name,

    u.id as unit_id,
    u.unit_code,
    u.name as unit_name,

    l.occupancy_start_date,
    l.actual_end_date,

    es.settlement_date,
    es.status as settlement_status,

    /*
     * Tenant ledger position immediately relevant to exit.
     */
    coalesce(
        kiraya.get_tenant_due(
            es.tenant_id
        ),
        0
    ) as tenant_due,

    coalesce(
        kiraya.get_tenant_credit(
            es.tenant_id
        ),
        0
    ) as tenant_credit,

    /*
     * Security deposit position.
     */
    coalesce(
        sd.total_received,
        0
    ) as deposit_received,

    coalesce(
        sd.total_deducted,
        0
    ) as deposit_deducted,

    greatest(
        0,
        coalesce(
            sd.total_received,
            0
        )
        -
        coalesce(
            sd.total_deducted,
            0
        )
    ) as deposit_refundable,

    es.total_due_amount,
    es.total_deduction_amount,
    es.refund_amount,
    es.amount_payable,

    es.created_at,
    es.finalized_at

from kiraya.exit_settlements es

join kiraya.tenants t
    on t.id = es.tenant_id

join kiraya.leases l
    on l.id = es.lease_id

join kiraya.units u
    on u.id = l.unit_id

join kiraya.properties p
    on p.id = u.property_id

left join (
    select
        tenant_id,

        sum(
            case
                when transaction_type in (
                    'RECEIPT',
                    'TOP_UP'
                )
                then amount
                else 0
            end
        ) as total_received,

        sum(
            case
                when transaction_type in (
                    'DEDUCTION'
                )
                then amount
                else 0
            end
        ) as total_deducted

    from kiraya.security_deposit_transactions

    group by tenant_id
) sd
    on sd.tenant_id = es.tenant_id;