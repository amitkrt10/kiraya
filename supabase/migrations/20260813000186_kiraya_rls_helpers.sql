-- ============================================================
-- KIRAYA
-- Migration: RLS helper functions
--
-- Purpose:
-- Centralized security helpers used by RLS policies.
--
-- IMPORTANT:
-- These functions use auth.uid() and should remain small and
-- deterministic.
--
-- SECURITY DEFINER is used so the functions can inspect
-- Kiraya membership tables without recursively invoking RLS.
-- ============================================================


-- ------------------------------------------------------------
-- Current authenticated profile
-- ------------------------------------------------------------

create or replace function kiraya.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select id
    from kiraya.profiles
    where auth_user_id = auth.uid()
      and is_active = true
    limit 1;
$$;


-- ------------------------------------------------------------
-- Is current user a platform super admin?
-- ------------------------------------------------------------

create or replace function kiraya.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select exists (
        select 1
        from kiraya.profile_roles pr
        join kiraya.roles r
            on r.id = pr.role_id
        where pr.profile_id = kiraya.current_profile_id()
          and pr.is_active = true
          and r.is_active = true
          and r.code = 'SUPER_ADMIN'
          and r.scope = 'PLATFORM'
    );
$$;


-- ------------------------------------------------------------
-- Is current user an active organization member?
-- ------------------------------------------------------------

create or replace function kiraya.is_organization_member(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
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
-- Is current user an organization admin?
-- ------------------------------------------------------------

create or replace function kiraya.is_organization_admin(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
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
              and omr.is_active = true
              and r.is_active = true
              and r.code in (
                  'CLIENT_ADMIN',
                  'ORG_ADMIN'
              )
        );
$$;


-- ------------------------------------------------------------
-- Can current user perform a specific permission?
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
              and omr.is_active = true
              and r.is_active = true
              and p.is_active = true
              and p.code = p_permission_code
        );
$$;


-- ------------------------------------------------------------
-- Tenant linked to current authenticated user
-- ------------------------------------------------------------

create or replace function kiraya.is_tenant_user(
    p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select exists (
        select 1
        from kiraya.tenant_user_links tul
        join kiraya.profiles p
            on p.id = tul.profile_id
        where tul.tenant_id = p_tenant_id
          and tul.profile_id = kiraya.current_profile_id()
          and tul.is_active = true
          and p.is_active = true
    );
$$;


-- ------------------------------------------------------------
-- Organization accessible to current user
-- ------------------------------------------------------------

create or replace function kiraya.can_access_organization(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select
        kiraya.is_super_admin()
        or kiraya.is_organization_member(p_organization_id);
$$;


-- ------------------------------------------------------------
-- Tenant data access
--
-- Organization members can access tenants in their org.
-- Tenant users can only access their own tenant.
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
as $$
    select
        kiraya.can_access_organization(p_organization_id)
        or kiraya.is_tenant_user(p_tenant_id);
$$;


-- ------------------------------------------------------------
-- Tenant write access
--
-- Tenant users are intentionally read-only.
-- Organization users require explicit permission.
-- ------------------------------------------------------------

create or replace function kiraya.can_write_organization(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select
        kiraya.is_super_admin()
        or kiraya.has_organization_permission(
            p_organization_id,
            'WRITE'
        );
$$;


-- ------------------------------------------------------------
-- Tenant write access
--
-- Tenants cannot modify financial/property data directly.
-- ------------------------------------------------------------

create or replace function kiraya.can_write_tenant_data(
    p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
as $$
    select
        kiraya.can_write_organization(p_organization_id);
$$;


comment on function kiraya.current_profile_id() is
    'Returns the Kiraya profile associated with auth.uid().';

comment on function kiraya.is_super_admin() is
    'Returns true when the authenticated user has the platform SUPER_ADMIN role.';

comment on function kiraya.is_organization_member(uuid) is
    'Returns true when the authenticated user belongs to the organization.';

comment on function kiraya.is_organization_admin(uuid) is
    'Returns true when the authenticated user is an organization administrator.';

comment on function kiraya.has_organization_permission(uuid, text) is
    'Checks whether the authenticated organization member has a permission.';

comment on function kiraya.is_tenant_user(uuid) is
    'Returns true when the authenticated profile is linked to the tenant.';

comment on function kiraya.can_access_organization(uuid) is
    'Checks whether the current user can access an organization.';

comment on function kiraya.can_access_tenant(uuid, uuid) is
    'Checks tenant access for organization members and tenant users.';

comment on function kiraya.can_write_organization(uuid) is
    'Checks organization-level write permission.';

comment on function kiraya.can_write_tenant_data(uuid) is
    'Checks whether the current user may write organization tenant data.';