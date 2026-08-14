-- ============================================================
-- KIRAYA
-- Migration: organizations
--
-- Purpose:
-- Represents a client/customer organization using Kiraya.
--
-- One Kiraya installation can have many organizations.
-- A user can belong to multiple organizations.
-- ============================================================

create table kiraya.organizations (
    id uuid primary key
        default gen_random_uuid(),

    organization_code text
        not null,

    name text
        not null,

    legal_name text,

    status kiraya.organization_status
        not null default 'ACTIVE',

    currency_code text
        not null default 'INR',

    timezone text
        not null default 'Asia/Kolkata',

    locale text
        not null default 'en-IN',

    phone text,

    email text,

    address_line_1 text,

    address_line_2 text,

    city text,

    state text,

    postal_code text,

    country_code text
        not null default 'IN',

    settings jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint organizations_code_check
        check (
            length(trim(organization_code)) > 0
        ),

    constraint organizations_name_check
        check (
            length(trim(name)) > 0
        ),

    constraint organizations_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint organizations_country_check
        check (
            country_code ~ '^[A-Z]{2}$'
        ),

    constraint organizations_settings_object_check
        check (
            jsonb_typeof(settings) = 'object'
        )
);

-- ============================================================
-- Indexes
-- ============================================================

create unique index organizations_code_unique_idx
    on kiraya.organizations (
        lower(trim(organization_code))
    );

create index organizations_status_idx
    on kiraya.organizations (status);

-- ============================================================
-- Comments
-- ============================================================

comment on table kiraya.organizations is
    'Client/customer organizations using the Kiraya rent management platform.';

comment on column kiraya.organizations.organization_code is
    'Human-readable unique identifier for the organization, e.g. ABC-001.';

comment on column kiraya.organizations.name is
    'Display name of the organization.';

comment on column kiraya.organizations.legal_name is
    'Registered/legal name of the organization, when applicable.';

comment on column kiraya.organizations.status is
    'Lifecycle status of the organization.';

comment on column kiraya.organizations.currency_code is
    'ISO 4217 currency code used by the organization. Defaults to INR.';

comment on column kiraya.organizations.timezone is
    'Default timezone used for dates, billing periods, reports and notifications.';

comment on column kiraya.organizations.locale is
    'Default locale used for formatting dates, numbers and currency.';

comment on column kiraya.organizations.settings is
    'Organization-level configurable settings stored as JSON.';