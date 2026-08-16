-- ============================================================
-- KIRAYA
-- P2.10: financial RPC security
--
-- Financial functions execute with elevated privileges.
-- Therefore:
--
--   PUBLIC        → no access
--   anon          → no access
--   authenticated → no direct access unless explicitly granted
--
-- The application should invoke higher-level authorized RPCs
-- that validate organization permissions.
-- ============================================================


revoke all
on function kiraya.post_bill_to_ledger(
    uuid,
    uuid
)
from public, anon, authenticated;


revoke all
on function kiraya.post_payment_to_ledger(
    uuid,
    uuid
)
from public, anon, authenticated;


revoke all
on function kiraya.reverse_payment_allocations(
    uuid,
    uuid,
    text
)
from public, anon, authenticated;


revoke all
on function kiraya.apply_tenant_credit_to_bill(
    uuid,
    numeric,
    uuid
)
from public, anon, authenticated;


revoke all
on function kiraya.void_bill(
    uuid,
    uuid,
    text
)
from public, anon, authenticated;