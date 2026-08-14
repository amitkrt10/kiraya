-- ============================================================
-- KIRAYA
-- Migration: tenant ledger reporting
-- ============================================================

create or replace view kiraya.v_tenant_ledger
with (security_invoker = true)
as
select
    le.organization_id,

    le.id as ledger_entry_id,

    le.tenant_id,
    t.tenant_code,
    t.full_name as tenant_name,

    le.lease_id,
    l.lease_number,

    le.bill_id,
    b.bill_number,

    le.payment_id,
    pay.payment_number,

    le.entry_type,
    le.entry_date,

    le.description,

    le.debit_amount,
    le.credit_amount,

    (
        le.debit_amount - le.credit_amount
    ) as net_amount,

    le.currency_code,
    le.reference_code,

    le.is_reversal,
    le.reverses_entry_id,

    le.created_at

from kiraya.ledger_entries le

join kiraya.tenants t
    on t.id = le.tenant_id

left join kiraya.leases l
    on l.id = le.lease_id

left join kiraya.bills b
    on b.id = le.bill_id

left join kiraya.payments pay
    on pay.id = le.payment_id;