-- ============================================================
-- KIRAYA
-- P6.2-D2: tenant profile data migration (Phase A backfill)
--
-- One-time backfill of pre-existing data into the new P6.2-D2
-- fields/table. The source columns (tax_identifier,
-- emergency_contact_name, emergency_contact_phone) are left
-- completely untouched — this migration only ever reads them and
-- writes elsewhere; nothing is dropped or overwritten.
--
-- Verified against live dev data before writing this migration:
-- 72/72 existing tenants have neither tax_identifier nor emergency
-- contact data populated, so this backfill is a no-op there today —
-- but it's written to run correctly against any tenant that does
-- have this data (e.g. other environments), and is safely
-- re-runnable: every write below is guarded so re-applying it
-- changes nothing already migrated.
--
-- 1. tax_identifier -> aadhaar_number / pan_number /
--    other_identity_document_number, by format:
--      - exactly matches PAN's well-known AAAAA9999A pattern (5
--        letters, 4 digits, 1 letter) -> pan_number
--      - exactly 12 digits once non-digit characters are stripped
--        (Aadhaar's own format, sometimes space/dash-separated)
--        -> aadhaar_number
--      - anything else -> other_identity_document_number, since its
--        document type cannot be safely inferred (never guessed,
--        per the explicit instruction not to discard or
--        misclassify existing data)
--    Each of the three UPDATEs below only touches a row where all
--    three target columns are still null, so a row is migrated by
--    at most one of them, and re-running this file is a no-op the
--    second time.
--
-- 2. emergency_contact_name / emergency_contact_phone -> a single
--    tenant_contacts row per tenant, contact_type = 'EMERGENCY',
--    sort_order = 1 — Emergency Contact 2 is intentionally left
--    empty (no row inserted for sort_order = 2). Only inserted for
--    a tenant with at least one of the two fields populated, and
--    only if no such row already exists (idempotent).
-- ============================================================

update kiraya.tenants
set pan_number = trim(tax_identifier)
where tax_identifier is not null
  and trim(tax_identifier) <> ''
  and pan_number is null
  and aadhaar_number is null
  and other_identity_document_number is null
  and trim(tax_identifier) ~ '^[A-Za-z]{5}[0-9]{4}[A-Za-z]$';

update kiraya.tenants
set aadhaar_number = regexp_replace(tax_identifier, '[^0-9]', '', 'g')
where tax_identifier is not null
  and trim(tax_identifier) <> ''
  and pan_number is null
  and aadhaar_number is null
  and other_identity_document_number is null
  and regexp_replace(tax_identifier, '[^0-9]', '', 'g') ~ '^[0-9]{12}$';

update kiraya.tenants
set other_identity_document_number = trim(tax_identifier)
where tax_identifier is not null
  and trim(tax_identifier) <> ''
  and pan_number is null
  and aadhaar_number is null
  and other_identity_document_number is null;

insert into kiraya.tenant_contacts (
    organization_id,
    tenant_id,
    contact_type,
    sort_order,
    name,
    phone
)
select
    t.organization_id,
    t.id,
    'EMERGENCY',
    1,
    nullif(trim(t.emergency_contact_name), ''),
    nullif(trim(t.emergency_contact_phone), '')
from kiraya.tenants t
where (
    (t.emergency_contact_name is not null and trim(t.emergency_contact_name) <> '')
    or (t.emergency_contact_phone is not null and trim(t.emergency_contact_phone) <> '')
)
and not exists (
    select 1
    from kiraya.tenant_contacts tc
    where tc.tenant_id = t.id
      and tc.contact_type = 'EMERGENCY'
      and tc.sort_order = 1
);
