-- ============================================================
-- KIRAYA
-- Migration: document RLS
-- ============================================================


-- ------------------------------------------------------------
-- Documents
--
-- Documents may belong to:
--   organization
--   property
--   unit
--   owner
--   tenant
--   lease
--   bill
--   payment
--   exit settlement
--
-- Organization users can access documents belonging to their
-- organization.
--
-- Tenant users can only access documents explicitly associated
-- with their own tenant.
-- ------------------------------------------------------------

create policy documents_select
on kiraya.documents
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
    or (
        tenant_id is not null
        and kiraya.is_tenant_user(tenant_id)
    )
);


create policy documents_insert
on kiraya.documents
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy documents_update
on kiraya.documents
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);