-- ============================================================
-- KIRAYA
-- P2 repair: organization membership RLS
-- ============================================================

drop policy if exists organization_members_select on kiraya.organization_members;
drop policy if exists organization_members_insert on kiraya.organization_members;
drop policy if exists organization_members_update on kiraya.organization_members;
drop policy if exists organization_members_delete on kiraya.organization_members;

create policy organization_members_select on kiraya.organization_members
for select to authenticated using (
    profile_id = kiraya.current_profile_id()
    or kiraya.can_access_organization(organization_id)
);

create policy organization_members_insert on kiraya.organization_members
for insert to authenticated with check (
    kiraya.is_super_admin() or kiraya.is_organization_admin(organization_id)
);

create policy organization_members_update on kiraya.organization_members
for update to authenticated using (
    kiraya.is_super_admin() or kiraya.is_organization_admin(organization_id)
) with check (
    kiraya.is_super_admin() or kiraya.is_organization_admin(organization_id)
);

create policy organization_members_delete on kiraya.organization_members
for delete to authenticated using (
    kiraya.is_super_admin() or kiraya.is_organization_admin(organization_id)
);
