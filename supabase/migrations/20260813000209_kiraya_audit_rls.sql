-- ============================================================
-- KIRAYA
-- Migration: audit log RLS
--
-- IMPORTANT:
-- Audit logs are append-only from the application perspective.
--
-- Users should never be allowed to UPDATE or DELETE audit
-- records.
-- ============================================================


create policy audit_logs_select
on kiraya.audit_logs
for select
to authenticated
using (
    kiraya.is_super_admin()
    or kiraya.can_access_organization(
        organization_id
    )
);


create policy audit_logs_insert
on kiraya.audit_logs
for insert
to authenticated
with check (
    kiraya.is_super_admin()
    or kiraya.can_access_organization(
        organization_id
    )
);


-- No UPDATE policy.
-- No DELETE policy.