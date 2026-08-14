-- ============================================================
-- KIRAYA
-- Migration: lease_parties
--
-- Purpose:
-- Allows a lease to have multiple parties.
--
-- The primary tenant is already represented by leases.tenant_id.
-- This table allows additional parties such as:
--
--   Co-tenant
--   Occupant
--   Guarantor
--   Other
--
-- This keeps the model flexible without requiring multiple
-- tenant records to be treated as the primary tenant.
-- ============================================================

create table kiraya.lease_parties (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    lease_id uuid
        not null
        references kiraya.leases(id)
        on delete cascade,

    tenant_id uuid
        references kiraya.tenants(id)
        on delete restrict,

    party_role kiraya.lease_party_role
        not null,

    display_name text,

    phone text,

    email text,

    notes text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint lease_parties_identity_check
        check (
            tenant_id is not null
            or display_name is not null
        ),

    constraint lease_parties_display_name_check
        check (
            display_name is null
            or length(trim(display_name)) > 0
        ),

    constraint lease_parties_metadata_object_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

create index lease_parties_organization_idx
    on kiraya.lease_parties (organization_id);

create index lease_parties_lease_idx
    on kiraya.lease_parties (lease_id);

create index lease_parties_tenant_idx
    on kiraya.lease_parties (tenant_id);

create unique index lease_parties_tenant_role_unique_idx
    on kiraya.lease_parties (
        lease_id,
        tenant_id,
        party_role
    )
    where tenant_id is not null;

comment on table kiraya.lease_parties is
    'Additional parties associated with a lease.';

comment on column kiraya.lease_parties.tenant_id is
    'Optional existing tenant record represented by this party.';

comment on column kiraya.lease_parties.party_role is
    'Role played by the party in the lease.';

comment on column kiraya.lease_parties.display_name is
    'Name for a party that does not have a Kiraya tenant record.';