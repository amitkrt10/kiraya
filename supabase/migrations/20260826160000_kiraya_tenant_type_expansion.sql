-- ============================================================
-- KIRAYA
-- P6.2-D2: expand kiraya.tenant_type
--
-- Adds SCHOOL, INSTITUTE, and FAMILY alongside the existing
-- INDIVIDUAL, COMPANY, OTHER values. Existing rows and their
-- tenant_type values are completely untouched — this only widens
-- the enum, it does not alter, reorder, rename, or remove any
-- existing value. Confirmed against live dev data before writing
-- this: all 72 existing tenants are INDIVIDUAL, none affected.
--
-- Kept as its own migration with no other DDL: Postgres does not
-- allow a newly added enum value to be referenced within the same
-- transaction that added it. A later migration/application code is
-- free to use these values without restriction.
-- ============================================================

alter type kiraya.tenant_type add value if not exists 'SCHOOL';
alter type kiraya.tenant_type add value if not exists 'INSTITUTE';
alter type kiraya.tenant_type add value if not exists 'FAMILY';
