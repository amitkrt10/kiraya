-- ============================================================
-- KIRAYA
-- Repair: corrected RLS helper layer
-- ============================================================

create or replace function kiraya.current_profile_id()
returns uuid
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select p.id
    from kiraya.profiles p
    where p.id = auth.uid()
      and p.status = 'ACTIVE'
    limit 1;
$$;

create or replace function kiraya.is_super_admin()
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.profile_roles pr
        join kiraya.roles r on r.id = pr.role_id
        where pr.profile_id = kiraya.current_profile_id()
          and r.code = 'SUPER_ADMIN'
          and r.scope = 'PLATFORM'
          and r.is_system = true
    );
$$;

create or replace function kiraya.is_organization_member(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.is_super_admin()
        or exists (
            select 1 from kiraya.organization_members om
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'
        );
$$;

create or replace function kiraya.is_organization_admin(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.is_super_admin()
        or exists (
            select 1
            from kiraya.organization_members om
            join kiraya.organization_member_roles omr on omr.organization_member_id = om.id
            join kiraya.roles r on r.id = omr.role_id
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'
              and r.scope = 'ORGANIZATION'
              and r.organization_id = p_organization_id
              and r.code in ('CLIENT_ADMIN','ORG_ADMIN')
        );
$$;

create or replace function kiraya.has_organization_permission(p_organization_id uuid, p_permission_code text)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.is_super_admin()
        or exists (
            select 1
            from kiraya.organization_members om
            join kiraya.organization_member_roles omr on omr.organization_member_id = om.id
            join kiraya.roles r on r.id = omr.role_id
            join kiraya.role_permissions rp on rp.role_id = r.id
            join kiraya.permissions p on p.id = rp.permission_id
            where om.organization_id = p_organization_id
              and om.profile_id = kiraya.current_profile_id()
              and om.status = 'ACTIVE'
              and r.scope = 'ORGANIZATION'
              and r.organization_id = p_organization_id
              and p.code = p_permission_code
        );
$$;

create or replace function kiraya.is_tenant_user(p_tenant_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1
        from kiraya.tenant_user_links tul
        join kiraya.profiles p on p.id = tul.profile_id
        join kiraya.tenants t on t.id = tul.tenant_id
        where tul.tenant_id = p_tenant_id
          and tul.profile_id = kiraya.current_profile_id()
          and tul.is_active = true
          and p.status = 'ACTIVE'
          and t.status = 'ACTIVE'
    );
$$;

create or replace function kiraya.can_access_organization(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select p_organization_id is not null
       and (kiraya.is_super_admin() or kiraya.is_organization_member(p_organization_id));
$$;

create or replace function kiraya.can_access_tenant(p_organization_id uuid, p_tenant_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select exists (
        select 1 from kiraya.tenants t
        where t.id = p_tenant_id
          and t.organization_id = p_organization_id
          and (kiraya.can_access_organization(p_organization_id) or kiraya.is_tenant_user(p_tenant_id))
    );
$$;

create or replace function kiraya.can_write_organization(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.is_super_admin()
        or kiraya.is_organization_admin(p_organization_id)
        or kiraya.has_organization_permission(p_organization_id, 'organization.write');
$$;

create or replace function kiraya.can_write_tenant_data(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.can_write_organization(p_organization_id);
$$;


create or replace function kiraya.can_import_organization(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = kiraya, public
set row_security = off
as $$
    select kiraya.is_super_admin()
        or kiraya.is_organization_admin(p_organization_id)
        or kiraya.has_organization_permission(p_organization_id, 'imports.execute');
$$;

revoke all on function kiraya.can_import_organization(uuid) from public;
