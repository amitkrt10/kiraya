-- ============================================================
-- KIRAYA
-- Migration: leases
--
-- Purpose:
-- Represents a contractual occupancy/rental relationship
-- between a tenant and a unit.
--
-- A tenant can have multiple leases over time.
-- A unit can have multiple leases over time, but overlapping
-- active occupancy will be prevented by a later constraint.
-- ============================================================

create table kiraya.leases (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    unit_id uuid
        not null
        references kiraya.units(id)
        on delete restrict,

    lease_code text
        not null,

    status kiraya.lease_status
        not null default 'DRAFT',

    agreement_start_date date
        not null,

    agreement_end_date date,

    occupancy_start_date date
        not null,

    actual_end_date date,

    notice_date date,

    move_in_date date,

    move_out_date date,

    currency_code text
        not null default 'INR',

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint leases_code_check
        check (
            length(trim(lease_code)) > 0
        ),

    constraint leases_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        ),

    constraint leases_agreement_dates_check
        check (
            agreement_end_date is null
            or agreement_end_date >= agreement_start_date
        ),

    constraint leases_occupancy_start_check
        check (
            occupancy_start_date >= agreement_start_date
        ),

    constraint leases_actual_end_check
        check (
            actual_end_date is null
            or actual_end_date >= occupancy_start_date
        ),

    constraint leases_notice_date_check
        check (
            notice_date is null
            or notice_date >= agreement_start_date
        ),

    constraint leases_move_in_date_check
        check (
            move_in_date is null
            or move_in_date >= occupancy_start_date
        ),

    constraint leases_move_out_date_check
        check (
            move_out_date is null
            or move_out_date >= occupancy_start_date
        ),

    constraint leases_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index leases_org_code_unique_idx
    on kiraya.leases (
        organization_id,
        lower(trim(lease_code))
    );

create index leases_organization_idx
    on kiraya.leases (organization_id);

create index leases_tenant_idx
    on kiraya.leases (tenant_id);

create index leases_unit_idx
    on kiraya.leases (unit_id);

create index leases_status_idx
    on kiraya.leases (
        organization_id,
        status
    );

create index leases_occupancy_start_idx
    on kiraya.leases (
        unit_id,
        occupancy_start_date
    );

comment on table kiraya.leases is
    'Contractual occupancy relationship between a tenant and a unit.';

comment on column kiraya.leases.lease_code is
    'Unique lease identifier within the organization.';

comment on column kiraya.leases.agreement_start_date is
    'Start date of the contractual agreement.';

comment on column kiraya.leases.agreement_end_date is
    'Contractual end date, if fixed-term.';

comment on column kiraya.leases.occupancy_start_date is
    'Date from which the tenant is considered liable for occupancy/rent.';

comment on column kiraya.leases.actual_end_date is
    'Actual lease termination date after tenant exit.';

comment on column kiraya.leases.notice_date is
    'Date on which termination/notice was recorded.';

comment on column kiraya.leases.move_in_date is
    'Physical move-in date, if different from occupancy start.';

comment on column kiraya.leases.move_out_date is
    'Physical move-out date after exit.';

comment on column kiraya.leases.metadata is
    'Additional lease-specific information.';