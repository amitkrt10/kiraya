-- ============================================================
-- KIRAYA
-- P6.2-D2: tenant_contacts
--
-- Normalized replacement for the single emergency_contact_name/
-- emergency_contact_phone pair on kiraya.tenants, generalized to
-- also hold Local References — both are the same shape (name,
-- phone, address) and both need up to two slots per tenant.
--
--   contact_type = EMERGENCY,       sort_order = 1 or 2
--   contact_type = LOCAL_REFERENCE, sort_order = 1 or 2
--
-- tenant_contacts_slot_unique_idx is what actually guarantees a
-- tenant can never end up with more than 2 rows per contact_type —
-- name/phone/address are all optional; only contact_type and
-- sort_order are required, matching "all fields optional" while
-- still identifying which of the two slots a row occupies.
--
-- emergency_contact_name/emergency_contact_phone on kiraya.tenants
-- are deliberately left in place, untouched, in this migration —
-- Phase A of the two-phase plan, mirroring the tax_identifier
-- decision in the previous migration.
--
-- RLS mirrors kiraya.tenant_credit_refunds' established pattern
-- (P5.7F) exactly — organization_id/tenant_id are direct columns on
-- this table, so authorization checks them straight, no join to the
-- parent needed: select via can_access_tenant(), insert/update via
-- can_write_organization(). No delete policy: a contact slot is
-- never hard-deleted, only ever updated in place (clearing its
-- fields empties the slot without removing the row), matching every
-- other detail-record table in this schema.
-- ============================================================

create type kiraya.tenant_contact_type as enum (
    'EMERGENCY',
    'LOCAL_REFERENCE'
);

create table kiraya.tenant_contacts (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    tenant_id uuid
        not null
        references kiraya.tenants(id)
        on delete cascade,

    contact_type kiraya.tenant_contact_type
        not null,

    sort_order smallint
        not null,

    name text,

    phone text,

    address text,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint tenant_contacts_sort_order_check
        check (sort_order in (1, 2)),

    constraint tenant_contacts_name_check
        check (
            name is null
            or length(trim(name)) > 0
        )
);

create unique index tenant_contacts_slot_unique_idx
    on kiraya.tenant_contacts (
        tenant_id,
        contact_type,
        sort_order
    );

create index tenant_contacts_organization_idx
    on kiraya.tenant_contacts (organization_id);

create index tenant_contacts_tenant_idx
    on kiraya.tenant_contacts (tenant_id);

comment on table kiraya.tenant_contacts is
    'Up to two named contacts per (tenant, contact_type) — Emergency Contacts and Local References. name/phone/address are all optional.';

comment on column kiraya.tenant_contacts.contact_type is
    'EMERGENCY or LOCAL_REFERENCE.';

comment on column kiraya.tenant_contacts.sort_order is
    'Which of the two slots (1 or 2) this contact occupies for its contact_type.';

alter table kiraya.tenant_contacts enable row level security;

create policy tenant_contacts_select on kiraya.tenant_contacts
  for select
  using (kiraya.can_access_tenant(organization_id, tenant_id));

create policy tenant_contacts_insert on kiraya.tenant_contacts
  for insert
  with check (kiraya.can_write_organization(organization_id));

create policy tenant_contacts_update on kiraya.tenant_contacts
  for update
  using (kiraya.can_write_organization(organization_id))
  with check (kiraya.can_write_organization(organization_id));
