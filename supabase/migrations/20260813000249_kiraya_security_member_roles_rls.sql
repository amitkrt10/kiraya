-- ============================================================
-- KIRAYA
-- P2.11: organization member role RLS
-- ============================================================


create policy organization_member_roles_select
on kiraya.organization_member_roles
for select
to authenticated
using (
    exists (
        select 1
        from kiraya.organization_members om
        where om.id = organization_member_id
          and kiraya.can_access_organization(
              om.organization_id
          )
    )
);


create policy organization_member_roles_insert
on kiraya.organization_member_roles
for insert
to authenticated
with check (
    exists (
        select 1
        from kiraya.organization_members om
        join kiraya.roles r
            on r.id = role_id
        where om.id = organization_member_id
          and r.scope = 'ORGANIZATION'
          and r.organization_id = om.organization_id
          and kiraya.is_organization_admin(
              om.organization_id
          )
    )
);


create policy organization_member_roles_delete
on kiraya.organization_member_roles
for delete
to authenticated
using (
    exists (
        select 1
        from kiraya.organization_members om
        where om.id = organization_member_id
          and kiraya.is_organization_admin(
              om.organization_id
          )
    )
);