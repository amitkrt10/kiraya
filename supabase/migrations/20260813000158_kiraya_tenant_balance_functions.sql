-- ============================================================
-- KIRAYA
-- Migration: tenant balance functions
--
-- Purpose:
-- Calculates tenant-level balance from the ledger.
--
-- Positive balance  = tenant owes money.
-- Negative balance  = tenant has credit.
-- Zero              = settled.
-- ============================================================

create or replace function kiraya.get_tenant_debit_total(
    p_tenant_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(debit_amount),
        0
    )
    from kiraya.ledger_entries
    where tenant_id = p_tenant_id;
$$;


create or replace function kiraya.get_tenant_credit_total(
    p_tenant_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(credit_amount),
        0
    )
    from kiraya.ledger_entries
    where tenant_id = p_tenant_id;
$$;


create or replace function kiraya.get_tenant_balance(
    p_tenant_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select
        kiraya.get_tenant_debit_total(p_tenant_id)
        -
        kiraya.get_tenant_credit_total(p_tenant_id);
$$;


comment on function kiraya.get_tenant_balance(uuid) is
    'Returns tenant financial balance. Positive means due; negative means credit.';