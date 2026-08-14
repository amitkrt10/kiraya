-- ============================================================
-- KIRAYA
-- Migration: profile role validation
--
-- Purpose:
-- Ensures profile_roles can only contain PLATFORM-scoped roles.
--
-- Example:
--
--   Profile
--      ↓
--   SUPER_ADMIN
--      ↓
--   PLATFORM
--
-- Organization roles belong in organization_member_roles.
-- ============================================================

create or replace function kiraya.validate_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    role_scope kiraya.role_scope;
    role_organization_id uuid;
begin

    select scope, organization_id
    into role_scope, role_organization_id
    from kiraya.roles
    where id = new.role_id;

    if role_scope is null then
        raise exception
            using
                errcode = '23503',
                message = 'Role does not exist.';
    end if;

    if role_scope <> 'PLATFORM' then
        raise exception
            using
                errcode = '23514',
                message = 'Invalid platform role.',
                detail = 'profile_roles can only reference PLATFORM-scoped roles.';
    end if;

    if role_organization_id is not null then
        raise exception
            using
                errcode = '23514',
                message = 'Invalid platform role.',
                detail = 'A PLATFORM-scoped role cannot belong to an organization.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_profile_role
before insert or update
on kiraya.profile_roles
for each row
execute function kiraya.validate_profile_role();

comment on function kiraya.validate_profile_role() is
    'Ensures profile-level roles are PLATFORM-scoped roles.';