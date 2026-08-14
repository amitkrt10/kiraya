-- ============================================================
-- KIRAYA
-- Migration: tenant credit functions
--
-- Purpose:
-- Handles overpayments.
--
-- Example:
--
-- Bill = ₹30,000
-- Payment = ₹35,000
--
-- Tenant balance becomes:
--
-- ₹30,000 debit
-- ₹35,000 credit
-- ----------------
-- -₹5,000
--
-- Tenant credit = ₹5,000
-- ============================================================

create or replace function kiraya.get_tenant_credit(
    p_tenant_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        -kiraya.get_tenant_balance(p_tenant_id)
    );
$$;


create or replace function kiraya.get_tenant_due(
    p_tenant_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        kiraya.get_tenant_balance(p_tenant_id)
    );
$$;


comment on function kiraya.get_tenant_credit(uuid) is
    'Returns available tenant credit created by overpayments or other credits.';


comment on function kiraya.get_tenant_due(uuid) is
    'Returns total tenant amount currently due.';