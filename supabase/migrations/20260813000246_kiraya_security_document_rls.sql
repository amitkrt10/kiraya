-- ============================================================
-- KIRAYA
-- P2.8: document tenant isolation
-- ============================================================


drop policy if exists documents_select
on kiraya.documents;


create policy documents_select
on kiraya.documents
for select
to authenticated
using (
    kiraya.can_access_organization(
        organization_id
    )

    or exists (
        select 1
        from kiraya.tenants t
        where t.id = documents.tenant_id
          and t.organization_id = documents.organization_id
          and kiraya.is_tenant_user(
              t.id
          )
    )
);