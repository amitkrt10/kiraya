-- ============================================================
-- KIRAYA
-- Migration: import_errors
--
-- Purpose:
-- Stores row-level validation/import failures.
-- ============================================================

create table kiraya.import_errors (
    id uuid primary key
        default gen_random_uuid(),

    import_id uuid
        not null
        references kiraya.imports(id)
        on delete cascade,

    row_number integer
        not null,

    field_name text,

    error_code text
        not null,

    error_message text
        not null,

    raw_value text,

    row_data jsonb,

    created_at timestamptz
        not null default now(),

    constraint import_errors_row_number_check
        check (row_number > 0),

    constraint import_errors_code_check
        check (length(trim(error_code)) > 0),

    constraint import_errors_message_check
        check (length(trim(error_message)) > 0),

    constraint import_errors_row_data_object_check
        check (
            row_data is null
            or jsonb_typeof(row_data) = 'object'
        )
);

create index import_errors_import_idx
    on kiraya.import_errors (
        import_id,
        row_number
    );

create index import_errors_code_idx
    on kiraya.import_errors (
        import_id,
        error_code
    );

comment on table kiraya.import_errors is
    'Row-level validation and processing errors from CSV imports.';