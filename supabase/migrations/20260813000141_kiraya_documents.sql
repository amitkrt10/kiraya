-- ============================================================
-- KIRAYA
-- Migration: documents
-- ============================================================

create table kiraya.documents (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        not null
        references kiraya.organizations(id)
        on delete restrict,

    uploaded_by uuid
        references kiraya.profiles(id)
        on delete restrict,

    document_type text
        not null,

    file_name text
        not null,

    storage_bucket text
        not null,

    storage_path text
        not null,

    mime_type text,

    file_size_bytes bigint,

    visibility kiraya.document_visibility
        not null default 'INTERNAL',

    tenant_id uuid
        references kiraya.tenants(id)
        on delete restrict,

    lease_id uuid
        references kiraya.leases(id)
        on delete restrict,

    property_id uuid
        references kiraya.properties(id)
        on delete restrict,

    unit_id uuid
        references kiraya.units(id)
        on delete restrict,

    bill_id uuid
        references kiraya.bills(id)
        on delete restrict,

    exit_settlement_id uuid
        references kiraya.exit_settlements(id)
        on delete restrict,

    checksum text,

    description text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint documents_type_check
        check (length(trim(document_type)) > 0),

    constraint documents_file_name_check
        check (length(trim(file_name)) > 0),

    constraint documents_bucket_check
        check (length(trim(storage_bucket)) > 0),

    constraint documents_path_check
        check (length(trim(storage_path)) > 0),

    constraint documents_file_size_check
        check (
            file_size_bytes is null
            or file_size_bytes >= 0
        ),

    constraint documents_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index documents_organization_idx
    on kiraya.documents (organization_id);

create index documents_tenant_idx
    on kiraya.documents (tenant_id);

create index documents_lease_idx
    on kiraya.documents (lease_id);

create index documents_property_idx
    on kiraya.documents (property_id);

create index documents_unit_idx
    on kiraya.documents (unit_id);

create index documents_bill_idx
    on kiraya.documents (bill_id);

create index documents_exit_settlement_idx
    on kiraya.documents (exit_settlement_id);

create index documents_visibility_idx
    on kiraya.documents (
        organization_id,
        visibility
    );

create index documents_storage_path_idx
    on kiraya.documents (storage_bucket, storage_path);

comment on table kiraya.documents is
    'Metadata for files stored in Supabase Storage.';

comment on column kiraya.documents.storage_path is
    'Path of the file inside the specified Supabase Storage bucket.';

comment on column kiraya.documents.visibility is
    'Controls whether the document is internal, client-visible, tenant-visible, or shared.';