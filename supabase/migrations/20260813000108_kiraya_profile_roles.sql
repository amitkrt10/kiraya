-- ============================================================
-- KIRAYA
-- Migration: profile_roles
--
-- Purpose:
-- Assigns platform-level roles directly to profiles.
--
-- Example:
--   Profile → SUPER_ADMIN
--
-- Organization-level roles must NOT be assigned here.
-- They belong in organization_member_roles.
-- ============================================================

create table kiraya.profile_roles (
    profile_id uuid
        not null
        references kiraya.profiles(id)
        on delete cascade,

    role_id uuid
        not null
        references kiraya.roles(id)
        on delete cascade,

    created_at timestamptz
        not null default now(),

    primary key (
        profile_id,
        role_id
    )
);

create index profile_roles_role_id_idx
    on kiraya.profile_roles (role_id);

comment on table kiraya.profile_roles is
    'Assigns platform-level roles to user profiles.';

comment on column kiraya.profile_roles.profile_id is
    'Profile receiving the platform role.';

comment on column kiraya.profile_roles.role_id is
    'Platform-scoped role assigned to the profile.';