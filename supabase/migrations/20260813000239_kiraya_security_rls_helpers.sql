-- ============================================================
-- KIRAYA
-- P2.1: corrected RLS helper layer
--
-- IMPORTANT:
-- These functions are SECURITY DEFINER because they inspect
-- membership/role tables while those tables themselves have RLS.
--
-- The functions deliberately use the actual Kiraya schema:
--
-- profiles.id = auth.users.id
-- profiles.status
-- organization_members.status
--
-- No nonexistent is_active columns are referenced.
-- ============================================================


-- ------------------------------------------------------------
-- Current profile
-- ------------------------------------------------------------

create or replace function kiraya.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select p.id
    from kiraya.profiles p
    where p.id = auth.uid()
      and p.status = 'ACTIVE'
    limit 1;
$$;


-- ------------------------------------------------------------
-- Super admin
-- ------------------------------------------------------------

create or replace function kiraya.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.profile_roles pr
        join kiraya.roles r
            on r.id = pr.role_id
        where pr.profile_id = kiraya.current_profile_id()
          and r.code = 'SUPER_ADMIN'
          and r.scope = 'PLATFORM'
          and r.is_system = true
    );
$$;


-- ------------------------------------------------------------
-- Organization membership
-- ------------------------------------------------------------

create or replace function kiraya.is_organization_member(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.is_super_admin()
        or exists (
            select 1
            from kiraya.organization_members om
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'
        );
$$;


-- ------------------------------------------------------------
-- Organization administrator
-- ------------------------------------------------------------

create or replace function kiraya.is_organization_admin(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.is_super_admin()
        or exists (
            select 1
            from kiraya.organization_members om
            join kiraya.organization_member_roles omr
                on omr.organization_member_id = om.id
            join kiraya.roles r
                on r.id = omr.role_id
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'
              and r.scope = 'ORGANIZATION'
              and r.organization_id = p_organization_id
              and r.code in (
                  'CLIENT_ADMIN',
                  'ORG_ADMIN'
              )
        );
$$;


-- ------------------------------------------------------------
-- Specific organization permission
-- ------------------------------------------------------------

create or replace function kiraya.has_organization_permission(
    p_organization_id uuid,
    p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.is_super_admin()
        or exists (
            select 1
            from kiraya.organization_members om
            join kiraya.organization_member_roles omr
                on omr.organization_member_id = om.id
            join kiraya.roles r
                on r.id = omr.role_id
            join kiraya.role_permissions rp
                on rp.role_id = r.id
            join kiraya.permissions p
                on p.id = rp.permission_id
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'

              and r.scope = 'ORGANIZATION'
              and r.organization_id = p_organization_id

              and p.is_active = true
              and p.code = p_permission_code
        );
$$;


-- ------------------------------------------------------------
-- Tenant user
-- ------------------------------------------------------------

create or replace function kiraya.is_tenant_user(
    p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.tenant_user_links tul
        join kiraya.profiles p
            on p.id = tul.profile_id
        join kiraya.tenants t
            on t.id = tul.tenant_id
        where tul.tenant_id = p_tenant_id
          and tul.profile_id = kiraya.current_profile_id()
          and tul.is_active = true
          and p.status = 'ACTIVE'
          and t.status = 'ACTIVE'
    );
$$;


-- ------------------------------------------------------------
-- Organization access
-- ------------------------------------------------------------

create or replace function kiraya.can_access_organization(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        p_organization_id is not null
        and (
            kiraya.is_super_admin()
            or kiraya.is_organization_member(
                p_organization_id
            )
        );
$$;


-- ------------------------------------------------------------
-- Tenant access
--
-- IMPORTANT:
-- Organization membership alone is not sufficient.
-- The tenant must actually belong to the supplied organization.
-- ------------------------------------------------------------

create or replace function kiraya.can_access_tenant(
    p_organization_id uuid,
    p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.tenants t
        where t.id = p_tenant_id
          and t.organization_id = p_organization_id
          and (
              kiraya.can_access_organization(
                  p_organization_id
              )
              or kiraya.is_tenant_user(
                  p_tenant_id
              )
          )
    );
$$;


-- ------------------------------------------------------------
-- Organization write access
--
-- CLIENT_ADMIN / ORG_ADMIN always have organization write
-- authority.
--
-- Custom roles can receive the explicit:
--
--   organization.write
--
-- permission.
-- ------------------------------------------------------------

create or replace function kiraya.can_write_organization(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.is_super_admin()
        or kiraya.is_organization_admin(
            p_organization_id
        )
        or kiraya.has_organization_permission(
            p_organization_id,
            'organization.write'
        );
$$;


-- ------------------------------------------------------------
-- Organization import access
-- ------------------------------------------------------------

create or replace function kiraya.can_import_organization(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.is_super_admin()
        or kiraya.is_organization_admin(
            p_organization_id
        )
        or kiraya.has_organization_permission(
            p_organization_id,
            'imports.execute'
        );
$$;


-- ------------------------------------------------------------
-- Tenant write access
--
-- Tenant users are always read-only.
-- ------------------------------------------------------------

create or replace function kiraya.can_write_tenant_data(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.can_write_organization(
        p_organization_id
    );
$$;


-- ------------------------------------------------------------
-- Comments
-- ------------------------------------------------------------

comment on function kiraya.current_profile_id() is
    'Returns the active Kiraya profile corresponding to auth.uid().';

comment on function kiraya.is_super_admin() is
    'Returns true for the platform SUPER_ADMIN role.';

comment on function kiraya.is_organization_member(uuid) is
    'Returns true for active organization membership.';

comment on function kiraya.is_organization_admin(uuid) is
    'Returns true for organization administrators.';

comment on function kiraya.has_organization_permission(uuid, text) is
    'Checks an explicit organization permission.';

comment on function kiraya.is_tenant_user(uuid) is
    'Checks whether the current authenticated profile is actively linked to the tenant.';

comment on function kiraya.can_access_organization(uuid) is
    'Checks organization access.';

comment on function kiraya.can_access_tenant(uuid, uuid) is
    'Checks tenant access while validating tenant-to-organization ownership.';

comment on function kiraya.can_write_organization(uuid) is
    'Checks organization write authority.';

comment on function kiraya.can_import_organization(uuid) is
    'Checks CSV import authority.';

comment on function kiraya.can_write_tenant_data(uuid) is
    'Checks organization-side write authority for tenant data.';