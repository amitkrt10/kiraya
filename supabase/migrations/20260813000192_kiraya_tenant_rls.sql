-- ============================================================
-- KIRAYA
-- Migration: tenant RLS
-- ============================================================


-- ------------------------------------------------------------
-- Tenants
--
-- Organization users:
--   Can access tenants in their organization.
--
-- Tenant users:
--   Can access only their own tenant record.
-- ------------------------------------------------------------

create policy tenants_select
on kiraya.tenants
for select
to authenticated
using (
    kiraya.can_access_tenant(
        organization_id,
        id
    )
);


create policy tenants_insert
on kiraya.tenants
for insert
to authenticated
with check (
    kiraya.can_write_organization(organization_id)
);


create policy tenants_update
on kiraya.tenants
for update
to authenticated
using (
    kiraya.can_write_organization(organization_id)
)
with check (
    kiraya.can_write_organization(organization_id)
);


-- ------------------------------------------------------------
-- Tenant user links
-- ------------------------------------------------------------

create policy tenant_user_links_select
on kiraya.tenant_user_links
for select
to authenticated
using (
    kiraya.is_super_admin()
    or profile_id = kiraya.current_profile_id()
    or exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.can_access_organization(
              t.organization_id
          )
    )
);


create policy tenant_user_links_insert
on kiraya.tenant_user_links
for insert
to authenticated
with check (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.is_organization_admin(
              t.organization_id
          )
    )
);


create policy tenant_user_links_update
on kiraya.tenant_user_links
for update
to authenticated
using (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.is_organization_admin(
              t.organization_id
          )
    )
)
with check (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.is_organization_admin(
              t.organization_id
          )
    )
);