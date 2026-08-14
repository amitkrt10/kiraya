-- ============================================================
-- KIRAYA
-- Migration: organization member role validation
--
-- Purpose:
-- Ensures that an organization member can only receive:
--
--   1. An ORGANIZATION-scoped role.
--   2. A role belonging to the same organization.
-- ============================================================

create or replace function kiraya.validate_organization_member_role()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    member_organization_id uuid;
    role_organization_id uuid;
    role_scope kiraya.role_scope;
begin

    select organization_id
    into member_organization_id
    from kiraya.organization_members
    where id = new.organization_member_id;

    if member_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Organization member does not exist.';
    end if;

    select organization_id, scope
    into role_organization_id, role_scope
    from kiraya.roles
    where id = new.role_id;

    if role_scope is null then
        raise exception
            using
                errcode = '23503',
                message = 'Role does not exist.';
    end if;

    if role_scope <> 'ORGANIZATION' then
        raise exception
            using
                errcode = '23514',
                message = 'Invalid organization role.',
                detail = 'An organization member can only receive an ORGANIZATION-scoped role.';
    end if;

    if role_organization_id is distinct from member_organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Organization role mismatch.',
                detail = 'The role must belong to the same organization as the member.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_organization_member_role
before insert or update
on kiraya.organization_member_roles
for each row
execute function kiraya.validate_organization_member_role();

comment on function kiraya.validate_organization_member_role() is
    'Ensures organization members receive only roles belonging to their organization.';