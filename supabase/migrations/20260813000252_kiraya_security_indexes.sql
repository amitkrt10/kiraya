-- ============================================================
-- KIRAYA
-- P2 repair: security/RLS indexes
-- ============================================================

create index if not exists organization_members_profile_status_idx
on kiraya.organization_members (profile_id, status, organization_id);

create index if not exists organization_members_org_profile_status_idx
on kiraya.organization_members (organization_id, profile_id, status);

create index if not exists profile_roles_profile_role_idx
on kiraya.profile_roles (profile_id, role_id);

create index if not exists organization_member_roles_member_role_idx
on kiraya.organization_member_roles (organization_member_id, role_id);

create index if not exists role_permissions_role_permission_idx
on kiraya.role_permissions (role_id, permission_id);

create index if not exists permissions_code_idx
on kiraya.permissions (code);

create index if not exists tenant_user_links_profile_active_idx
on kiraya.tenant_user_links (profile_id, is_active, tenant_id);

create index if not exists tenant_user_links_tenant_active_idx
on kiraya.tenant_user_links (tenant_id, is_active, profile_id);

create index if not exists tenants_organization_status_idx
on kiraya.tenants (organization_id, status, id);

create index if not exists meters_unit_organization_idx
on kiraya.meters (unit_id, organization_id);
