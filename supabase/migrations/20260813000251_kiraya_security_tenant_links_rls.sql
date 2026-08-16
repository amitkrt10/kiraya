-- ============================================================
-- KIRAYA
-- P2.13: tenant user link RLS
-- ============================================================


create policy tenant_user_links_select
on kiraya.tenant_user_links
for select
to authenticated
using (
    profile_id = kiraya.current_profile_id()
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
    exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.can_write_organization(
              t.organization_id
          )
    )
);


create policy tenant_user_links_update
on kiraya.tenant_user_links
for update
to authenticated
using (
    exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.can_write_organization(
              t.organization_id
          )
    )
)
with check (
    exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.can_write_organization(
              t.organization_id
          )
    )
);


create policy tenant_user_links_delete
on kiraya.tenant_user_links
for delete
to authenticated
using (
    exists (
        select 1
        from kiraya.tenants t
        where t.id = tenant_id
          and kiraya.can_write_organization(
              t.organization_id
          )
    )
);