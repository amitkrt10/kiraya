-- ============================================================
-- KIRAYA
-- Migration: imports
--
-- Purpose:
-- Tracks CSV import jobs.
--
-- Supports Super Admin and Client Admin legacy-data imports.
-- ============================================================

create table kiraya.imports (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid
        references kiraya.organizations(id)
        on delete restrict,

    uploaded_by uuid
        not null
        references kiraya.profiles(id)
        on delete restrict,

    import_type text
        not null,

    file_name text
        not null,

    storage_bucket text,

    storage_path text,

    status kiraya.import_status
        not null default 'UPLOADED',

    total_rows integer
        not null default 0,

    valid_rows integer
        not null default 0,

    invalid_rows integer
        not null default 0,

    imported_rows integer
        not null default 0,

    failed_rows integer
        not null default 0,

    started_at timestamptz,

    completed_at timestamptz,

    error_summary text,

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint imports_type_check
        check (length(trim(import_type)) > 0),

    constraint imports_file_name_check
        check (length(trim(file_name)) > 0),

    constraint imports_total_rows_check
        check (total_rows >= 0),

    constraint imports_valid_rows_check
        check (valid_rows >= 0),

    constraint imports_invalid_rows_check
        check (invalid_rows >= 0),

    constraint imports_imported_rows_check
        check (imported_rows >= 0),

    constraint imports_failed_rows_check
        check (failed_rows >= 0),

    constraint imports_metadata_object_check
        check (jsonb_typeof(metadata) = 'object')
);

create index imports_organization_idx
    on kiraya.imports (organization_id);

create index imports_uploaded_by_idx
    on kiraya.imports (uploaded_by);

create index imports_status_idx
    on kiraya.imports (
        organization_id,
        status
    );

create index imports_type_idx
    on kiraya.imports (
        organization_id,
        import_type
    );

comment on table kiraya.imports is
    'CSV and legacy-data import jobs.';

comment on column kiraya.imports.organization_id is
    'Target organization. NULL is permitted for Super Admin platform-level imports.';

comment on column kiraya.imports.import_type is
    'Import category such as PROPERTIES, TENANTS, LEASES, PAYMENTS or FULL_LEGACY.';

comment on column kiraya.imports.total_rows is
    'Total rows found in the uploaded file.';

comment on column kiraya.imports.imported_rows is
    'Rows successfully committed into Kiraya.';