-- ============================================================
-- KIRAYA
-- P6.2-D2 amendment: tenant member_count
--
-- Number of people associated with/occupying under this tenant
-- profile — NOT the number of units rented (that remains a separate
-- Tenant-Unit relationship, out of scope here). Optional; existing
-- tenants are never forced to have a value.
--
-- integer already rejects decimals and non-numeric input at the
-- type level; the check constraint only needs to additionally
-- reject 0 and negative values.
-- ============================================================

alter table kiraya.tenants
    add column member_count integer;

alter table kiraya.tenants
    add constraint tenants_member_count_check
        check (member_count is null or member_count >= 1);

comment on column kiraya.tenants.member_count is
    'Number of people associated with/occupying under this tenant profile. Optional. Not the number of units rented.';
