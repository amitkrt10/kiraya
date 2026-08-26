-- ============================================================
-- KIRAYA
-- P6.2-D2 amendment: religion becomes a fixed-option dropdown
--
-- Religion was added in P6.2-D2 (20260826161000) as free text.
-- Replaced here with kiraya.tenant_religion, a plain Postgres enum —
-- the same pattern already established by kiraya.tenant_type/
-- kiraya.tenant_status on this exact table, not a new lookup table
-- or admin-configurable settings mechanism (explicitly out of scope
-- for this amendment).
--
-- Stable stored codes, not display labels — application code maps
-- each code to its label (e.g. PARSI_ZOROASTRIAN -> "Parsi /
-- Zoroastrian"), matching how TENANT_TYPES/TENANT_STATUSES are
-- already handled in lib/validation/tenant.ts and their *_LABELS
-- maps in components/tenants/TenantForm.tsx.
--
-- Data safety: verified against both the local and linked (hosted)
-- databases before writing this migration — 0/9 local and 0/72
-- hosted tenants have any non-blank religion value, so the column
-- type change below has no existing data to lose or misclassify.
-- Had any existed, this migration would have stopped short of a
-- destructive conversion instead.
-- ============================================================

create type kiraya.tenant_religion as enum (
    'HINDU',
    'MUSLIM',
    'CHRISTIAN',
    'SIKH',
    'BUDDHIST',
    'JAIN',
    'PARSI_ZOROASTRIAN',
    'JEWISH',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);

alter table kiraya.tenants
    alter column religion type kiraya.tenant_religion
    using nullif(trim(religion), '')::kiraya.tenant_religion;

comment on column kiraya.tenants.religion is
    'Optional, fixed-option religion (kiraya.tenant_religion). No configuration table — options are fixed in application code.';
