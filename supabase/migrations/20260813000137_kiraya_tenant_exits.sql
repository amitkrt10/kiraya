-- ============================================================
-- KIRAYA
-- Migration: tenant_exits
--
-- Purpose:
-- Initiates and tracks tenant exit from a lease.
--
-- The exit process is separate from the lease itself because
-- an exit requires:
--
--   - notice
--   - actual move-out
--   - pending bills
--   - previous dues
--   - deposit deductions
--   - refund/collection
--   - final settlement
-- ============================================================

create table kiraya.tenant_exits (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete restrict,

    exit_reference text
        not null,

    notice_date date,

    planned_exit_date date,

    actual_exit_date date,

    handover_date date,

    status kiraya.exit_status
        not null default 'INITIATED',

    reason text,

    final_meter_reading_date date,

    initiated_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint tenant_exits_reference_check
        check (
            length(trim(exit_reference)) > 0
        ),

    constraint tenant_exits_planned_date_check
        check (
            planned_exit_date is null
            or notice_date is null
            or planned_exit_date >= notice_date
        ),

    constraint tenant_exits_actual_date_check
        check (
            actual_exit_date is null
            or actual_exit_date >= coalesce(notice_date, actual_exit_date)
        ),

    constraint tenant_exits_handover_date_check
        check (
            handover_date is null
            or actual_exit_date is null
            or handover_date >= actual_exit_date
        ),

    constraint tenant_exits_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create unique index tenant_exits_org_reference_unique_idx
    on kiraya.tenant_exits (
        organization_id,
        lower(trim(exit_reference))
    );

-- A lease should normally have only one active exit process.
create unique index tenant_exits_active_lease_unique_idx
    on kiraya.tenant_exits (lease_id)
    where status in (
        'INITIATED',
        'PENDING_SETTLEMENT'
    );

create index tenant_exits_organization_idx
    on kiraya.tenant_exits (organization_id);

create index tenant_exits_lease_idx
    on kiraya.tenant_exits (lease_id);

create index tenant_exits_tenant_idx
    on kiraya.tenant_exits (tenant_id);

create index tenant_exits_status_idx
    on kiraya.tenant_exits (
        organization_id,
        status
    );

comment on table kiraya.tenant_exits is
    'Tenant exit process associated with a lease.';

comment on column kiraya.tenant_exits.exit_reference is
    'Unique human-readable exit reference.';

comment on column kiraya.tenant_exits.planned_exit_date is
    'Expected tenant exit date.';

comment on column kiraya.tenant_exits.actual_exit_date is
    'Actual date tenant liability/occupancy ended.';

comment on column kiraya.tenant_exits.handover_date is
    'Date physical possession was handed back.';

comment on column kiraya.tenant_exits.final_meter_reading_date is
    'Date used for final utility/meter settlement.';