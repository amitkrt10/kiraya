-- ============================================================
-- KIRAYA
-- Migration: identity and role RLS
-- ============================================================


-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------

create policy profiles_select
on kiraya.profiles
for select
to authenticated
using (
    id = kiraya.current_profile_id()
    or kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.organization_members om
        where om.profile_id = profiles.id
          and kiraya.is_organization_member(
              om.organization_id
          )
    )
);


create policy profiles_update_self
on kiraya.profiles
for update
to authenticated
using (
    id = kiraya.current_profile_id()
)
with check (
    id = kiraya.current_profile_id()
);


create policy profiles_update_admin
on kiraya.profiles
for update
to authenticated
using (
    kiraya.is_super_admin()
)
with check (
    kiraya.is_super_admin()
);


-- ------------------------------------------------------------
-- Profile roles
-- ------------------------------------------------------------

create policy profile_roles_select
on kiraya.profile_roles
for select
to authenticated
using (
    profile_id = kiraya.current_profile_id()
    or kiraya.is_super_admin()
);


create policy profile_roles_insert
on kiraya.profile_roles
for insert
to authenticated
with check (
    kiraya.is_super_admin()
);


create policy profile_roles_update
on kiraya.profile_roles
for update
to authenticated
using (
    kiraya.is_super_admin()
)
with check (
    kiraya.is_super_admin()
);


-- ------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------

create policy roles_select
on kiraya.roles
for select
to authenticated
using (
    scope = 'PLATFORM'
    and kiraya.is_super_admin()
    or
    scope = 'ORGANIZATION'
    and organization_id is not null
    and kiraya.can_access_organization(
        organization_id
    )
);


create policy roles_insert
on kiraya.roles
for insert
to authenticated
with check (
    kiraya.is_super_admin()
    or (
        scope = 'ORGANIZATION'
        and kiraya.is_organization_admin(
            organization_id
        )
    )
);


create policy roles_update
on kiraya.roles
for update
to authenticated
using (
    kiraya.is_super_admin()
    or (
        scope = 'ORGANIZATION'
        and kiraya.is_organization_admin(
            organization_id
        )
    )
)
with check (
    kiraya.is_super_admin()
    or (
        scope = 'ORGANIZATION'
        and kiraya.is_organization_admin(
            organization_id
        )
    )
);


-- ------------------------------------------------------------
-- Permissions
--
-- Permissions are platform configuration.
-- Normal clients can read them only through role metadata
-- exposed by the application.
-- ------------------------------------------------------------

create policy permissions_select
on kiraya.permissions
for select
to authenticated
using (
    kiraya.is_super_admin()
);


create policy permissions_modify
on kiraya.permissions
for all
to authenticated
using (
    kiraya.is_super_admin()
)
with check (
    kiraya.is_super_admin()
);


-- ------------------------------------------------------------
-- Role permissions
-- ------------------------------------------------------------

create policy role_permissions_select
on kiraya.role_permissions
for select
to authenticated
using (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.roles r
        where r.id = role_id
          and r.scope = 'ORGANIZATION'
          and kiraya.can_access_organization(
              r.organization_id
          )
    )
);


create policy role_permissions_modify
on kiraya.role_permissions
for all
to authenticated
using (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.roles r
        where r.id = role_id
          and r.scope = 'ORGANIZATION'
          and kiraya.is_organization_admin(
              r.organization_id
          )
    )
)
with check (
    kiraya.is_super_admin()
    or exists (
        select 1
        from kiraya.roles r
        where r.id = role_id
          and r.scope = 'ORGANIZATION'
          and kiraya.is_organization_admin(
              r.organization_id
          )
    )
);