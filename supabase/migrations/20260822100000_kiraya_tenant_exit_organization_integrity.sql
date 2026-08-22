-- ============================================================
-- KIRAYA
-- Migration: tenant exit organization integrity (P5.7K)
--
-- Purpose:
-- kiraya.tenant_exits had no organization-consistency trigger
-- (unlike bills/payments/security_deposits, which all have one via
-- 20260813000152_kiraya_organization_consistency_triggers.sql).
-- Its RLS policies only check kiraya.can_write_organization(organization_id)
-- -- they never verify that lease_id/tenant_id actually belong to that
-- organization, or to each other. This was confirmed live and exploitable
-- (P5.7J): an authenticated Org A user inserted a tenant_exits row with
-- organization_id = Org A, lease_id = a real Org A lease, but
-- tenant_id = a real Org B tenant, and the insert succeeded.
--
-- This migration adds the missing trigger, following the exact pattern
-- already established for bills/payments/security_deposits in
-- 20260813000152_kiraya_organization_consistency_triggers.sql:
-- security invoker (not definer), relying on the referenced tables'
-- own RLS to turn a cross-organization reference into a "does not
-- exist" (23503) rejection, plus an explicit organization-mismatch
-- (23514) check for cases where both referenced rows happen to be
-- visible. A third check -- lease.tenant_id must equal
-- new.tenant_id -- covers the case a plain organization check cannot:
-- a lease and tenant that are both genuinely in the same organization
-- but do not belong to each other.
--
-- This is an additional integrity layer only. It does not change
-- settlement mathematics, refund-pool semantics, ledger semantics,
-- or payment allocation, and it does not touch any existing trigger,
-- function, or RLS policy.
-- ============================================================

create or replace function kiraya.validate_tenant_exit_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    lease_organization_id uuid;
    lease_tenant_id uuid;
    tenant_organization_id uuid;
begin
    select organization_id, tenant_id
    into lease_organization_id, lease_tenant_id
    from kiraya.leases
    where id = new.lease_id;

    select organization_id
    into tenant_organization_id
    from kiraya.tenants
    where id = new.tenant_id;

    if lease_organization_id is null
       or tenant_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Tenant exit related record does not exist.';
    end if;

    if lease_organization_id is distinct from new.organization_id
       or tenant_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Tenant exit organization mismatch.';
    end if;

    if lease_tenant_id is distinct from new.tenant_id then
        raise exception
            using
                errcode = '23514',
                message = 'Tenant exit lease/tenant mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_tenant_exit_organization
before insert or update
on kiraya.tenant_exits
for each row
execute function kiraya.validate_tenant_exit_organization();
