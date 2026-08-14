-- ============================================================
-- KIRAYA
-- Migration: organization_members
--
-- Purpose:
-- Links Supabase Auth profiles to organizations.
--
-- A profile can belong to multiple organizations.
-- A profile can have different roles in each organization.
-- ============================================================

create table kiraya.organization_members (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete cascade,

    profile_id uuid
        not null
        references kiraya.profiles(id)
        on delete restrict,

    status kiraya.member_status
        not null default 'INVITED',

    display_name text,

    joined_at timestamptz,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint organization_members_display_name_check
        check (
            display_name is null
            or length(trim(display_name)) > 0
        ),

    constraint organization_members_joined_at_check
        check (
            status in ('INVITED', 'ACTIVE')
            or joined_at is not null
        )
);

-- A profile can belong to an organization only once.
create unique index organization_members_org_profile_unique_idx
    on kiraya.organization_members (
        organization_id,
        profile_id
    );

create index organization_members_profile_id_idx
    on kiraya.organization_members (profile_id);

create index organization_members_organization_status_idx
    on kiraya.organization_members (
        organization_id,
        status
    );

comment on table kiraya.organization_members is
    'Membership relationship between users and client organizations.';

comment on column kiraya.organization_members.organization_id is
    'Organization to which the user belongs.';

comment on column kiraya.organization_members.profile_id is
    'Application profile associated with the Supabase Auth user.';

comment on column kiraya.organization_members.status is
    'Membership lifecycle status.';

comment on column kiraya.organization_members.display_name is
    'Optional organization-specific display name.';

comment on column kiraya.organization_members.joined_at is
    'Timestamp when the member officially joined the organization.';