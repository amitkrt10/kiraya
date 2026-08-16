-- ============================================================
-- KIRAYA
-- P3.9: tenant ledger
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

    coalesce(
        le.debit_amount,
        0
    ) as debit_amount,

    coalesce(
        le.credit_amount,
        0
    ) as credit_amount,

    le.currency_code,

    le.reference_code,

    le.is_reversal,

    le.reverses_entry_id,

    le.created_at,

    /*
     * Running tenant balance:
     *
     * Debit  = tenant owes more
     * Credit = tenant paid / has credit
     */
    sum(
        coalesce(
            le.debit_amount,
            0
        )
        -
        coalesce(
            le.credit_amount,
            0
        )
    ) over (
        partition by le.tenant_id
        order by
            le.entry_date,
            le.created_at,
            le.id
        rows between unbounded preceding
        and current row
    ) as running_balance

from kiraya.ledger_entries le

join kiraya.tenants t
    on t.id = le.tenant_id

left join kiraya.leases l
    on l.id = le.lease_id

left join kiraya.bills b
    on b.id = le.bill_id

left join kiraya.payments pay
    on pay.id = le.payment_id;