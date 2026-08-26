-- ============================================================
-- KIRAYA
-- P6.2-D2: tenant profile fields — religion, identity documents
--
-- Adds four new optional columns to kiraya.tenants:
--   religion                        — free text, optional
--   aadhaar_number                  — optional identity document
--   pan_number                      — optional identity document
--   other_identity_document_number  — optional identity document,
--                                      also the migration target for
--                                      existing tax_identifier values
--                                      whose type can't be inferred
--                                      (see the data-migration
--                                      migration that follows)
--
-- No CHECK constraints (non-empty-if-present etc.) — matches every
-- other optional freeform text column already on this table
-- (legal_name, tax_identifier, phone, ...), none of which carry one
-- either.
--
-- tax_identifier is deliberately left in place, untouched, in this
-- migration — Phase A of a two-phase plan (add new columns, migrate
-- data, update application, verify — THEN remove the old column in
-- a later, separate, explicitly-requested migration). Removing it
-- now would be premature.
-- ============================================================

alter table kiraya.tenants
    add column religion text,
    add column aadhaar_number text,
    add column pan_number text,
    add column other_identity_document_number text;

comment on column kiraya.tenants.religion is
    'Optional free-text religion field.';

comment on column kiraya.tenants.aadhaar_number is
    'Optional Aadhaar identity document number.';

comment on column kiraya.tenants.pan_number is
    'Optional PAN identity document number.';

comment on column kiraya.tenants.other_identity_document_number is
    'Optional identity document number of a type other than Aadhaar/PAN. Also the migration target (P6.2-D2) for pre-existing tax_identifier values whose document type could not be inferred.';
