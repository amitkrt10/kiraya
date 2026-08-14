-- ============================================================
-- KIRAYA
-- Migration: organization RLS
-- ============================================================


-- ------------------------------------------------------------
-- Organizations
-- ------------------------------------------------------------

create policy organizations_select
on kiraya.organizations
for select
to authenticated
using (
    kiraya.can_access_organization(id)
);


create policy organizations_insert
on kiraya.organizations
for insert
to authenticated
with check (
    kiraya.is_super_admin()
);


create policy organizations_update
on kiraya.organizations
for update
to authenticated
using (
    kiraya.is_organization_admin(id)
)
with check (
    kiraya.is_organization_admin(id)
);


-- Organizations are never physically deleted.
-- Deactivation is preferred.


-- ------------------------------------------------------------
-- Organization members
-- ------------------------------------------------------------

create policy organization_members_select
on kiraya.organization_members
for select
to authenticated
using (
    kiraya.can_access_organization(organization_id)
);


create policy organization_members_insert
on kiraya.organization_members
for insert
to authenticated
with check (
    kiraya.is_organization_admin(organization_id)
);


create policy organization_members_update
on kiraya.organization_members
for update
to authenticated
using (
    kiraya.is_organization_admin(organization_id)
)
with check (
    kiraya.is_organization_admin(organization_id)
);


-- ------------------------------------------------------------
-- Organization member roles
-- ------------------------------------------------------------

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
        where om.id = organization_member_id
          and kiraya.is_organization_admin(
              om.organization_id
          )
    )
);


create policy organization_member_roles_update
on kiraya.organization_member_roles
for update
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
)
with check (
    exists (
        select 1
        from kiraya.organization_members om
        where om.id = organization_member_id
          and kiraya.is_organization_admin(
              om.organization_id
          )
    )
);