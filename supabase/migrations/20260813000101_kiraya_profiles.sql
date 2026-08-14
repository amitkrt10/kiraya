-- ============================================================
-- KIRAYA
-- Migration: profiles
--
-- Purpose:
-- Application-level profile linked 1:1 with Supabase Auth.
--
-- IMPORTANT:
-- Passwords and authentication credentials are managed by
-- Supabase Auth (auth.users), NOT by this table.
-- ============================================================

create table kiraya.profiles (
    id uuid primary key
        references auth.users(id)
        on delete restrict,

    full_name text,

    phone text,

    avatar_url text,

    status kiraya.profile_status
        not null default 'ACTIVE',

    timezone text
        not null default 'Asia/Kolkata',

    locale text
        not null default 'en-IN',

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint profiles_full_name_check
        check (
            full_name is null
            or length(trim(full_name)) > 0
        ),

    constraint profiles_phone_check
        check (
            phone is null
            or length(trim(phone)) > 0
        )
);

comment on table kiraya.profiles is
    'Application profile associated with a Supabase Auth user.';

comment on column kiraya.profiles.id is
    'Same UUID as auth.users.id.';

comment on column kiraya.profiles.phone is
    'Phone number used as contact information. Authentication is managed by Supabase Auth.';

comment on column kiraya.profiles.status is
    'Application-level profile status. Does not replace Supabase Auth user status.';

comment on column kiraya.profiles.timezone is
    'Preferred timezone for this user.';

comment on column kiraya.profiles.locale is
    'Preferred locale for this user.';