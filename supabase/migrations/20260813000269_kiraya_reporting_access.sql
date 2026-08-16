-- ============================================================
-- KIRAYA
-- P3.15: reporting access contract
--
-- Views use security_invoker=true, so underlying table RLS
-- remains authoritative.
--
-- These comments document the intended application boundary.
-- ============================================================


comment on view kiraya.v_organization_dashboard is
    'Organization dashboard. Application must filter by the current organization; underlying RLS remains authoritative.';


comment on view kiraya.v_platform_dashboard is
    'Platform-level dashboard intended for SUPER_ADMIN portfolio reporting only.';


comment on view kiraya.v_collection_performance is
    'Organization-scoped monthly billed-vs-collected performance.';


comment on view kiraya.v_collection_by_payment_method is
    'Organization-scoped monthly collection breakdown by payment method.';


comment on view kiraya.v_tenant_ledger is
    'Tenant financial ledger. Positive balance means amount owed; negative balance means tenant credit.';


comment on view kiraya.v_tenant_bill_summary is
    'Tenant bill-level summary including paid amount and current balance.';