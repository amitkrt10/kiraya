-- ============================================================
-- KIRAYA
-- Migration: audit_logs
--
-- Purpose:
-- Immutable application audit trail.
--
-- This migration intentionally occurs after:
--   profiles
--   organizations
--
-- because audit records reference both.
-- ============================================================

create table kiraya.audit_logs (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        references kiraya.organizations(id)
        on delete restrict,

    actor_profile_id uuid
        references kiraya.profiles(id)
        on delete restrict,

    action text
        not null,

    resource_type text
        not null,

    resource_id uuid,

    description text,

    old_data jsonb,

    new_data jsonb,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    constraint audit_logs_action_check
        check (
            length(trim(action)) > 0
        ),

    constraint audit_logs_resource_type_check
        check (
            length(trim(resource_type)) > 0
        ),

    constraint audit_logs_old_data_check
        check (
            old_data is null
            or jsonb_typeof(old_data) = 'object'
        ),

    constraint audit_logs_new_data_check
        check (
            new_data is null
            or jsonb_typeof(new_data) = 'object'
        ),

    constraint audit_logs_metadata_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);


create index audit_logs_organization_idx
    on kiraya.audit_logs (
        organization_id,
        created_at desc
    );


create index audit_logs_actor_idx
    on kiraya.audit_logs (
        actor_profile_id,
        created_at desc
    );


create index audit_logs_resource_idx
    on kiraya.audit_logs (
        resource_type,
        resource_id,
        created_at desc
    );


create index audit_logs_action_idx
    on kiraya.audit_logs (
        action,
        created_at desc
    );


comment on table kiraya.audit_logs is
    'Append-only audit history for important Kiraya application actions.';

comment on column kiraya.audit_logs.organization_id is
    'Organization affected by the audited action. NULL for platform-level actions.';

comment on column kiraya.audit_logs.actor_profile_id is
    'Profile that initiated the action.';

comment on column kiraya.audit_logs.action is
    'Machine-readable action such as BILL_GENERATION_FAILED.';

comment on column kiraya.audit_logs.resource_type is
    'Type of resource affected, such as LEASE, BILL or PAYMENT.';

comment on column kiraya.audit_logs.resource_id is
    'Identifier of the affected resource when available.';

comment on column kiraya.audit_logs.old_data is
    'Previous state snapshot when applicable.';

comment on column kiraya.audit_logs.new_data is
    'New state snapshot when applicable.';