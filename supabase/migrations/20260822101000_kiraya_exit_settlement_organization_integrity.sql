-- ============================================================
-- KIRAYA
-- Migration: exit settlement organization integrity (P5.7K)
--
-- Purpose:
-- kiraya.exit_settlements has the same gap as kiraya.tenant_exits
-- (repaired by 20260822100000_kiraya_tenant_exit_organization_integrity.sql):
-- its RLS policies only check kiraya.can_write_organization(organization_id),
-- with no cross-check that lease_id/tenant_id/tenant_exit_id are actually
-- consistent with each other.
--
-- Unlike tenant_exits (which has no parent to check against), every
-- exit_settlements row already carries a tenant_exit_id pointing at its
-- own parent tenant_exits row. Once tenant_exits itself is guaranteed
-- internally consistent (previous migration), the simplest and
-- strongest check for a settlement is that it matches its own parent
-- exactly -- organization_id, lease_id, and tenant_id must all equal
-- the referenced tenant_exits row's own values. This also naturally
-- rejects a settlement whose tenant_exit_id belongs to a different
-- organization altogether: that parent row would not be visible under
-- kiraya.tenant_exits' own RLS to an invoker from a different
-- organization, so the lookup returns no row and this trigger raises
-- 23503, exactly mirroring the existing project-wide pattern.
--
-- security invoker (not definer) -- same reasoning as the tenant_exits
-- trigger and every other organization-consistency trigger in this
-- schema (20260813000152_kiraya_organization_consistency_triggers.sql):
-- RLS on the referenced table does the real work of hiding
-- cross-organization rows from the check.
--
-- This is an additional integrity layer only. It does not change
-- settlement mathematics, refund-pool semantics, ledger semantics,
-- or payment allocation, and it does not touch any existing trigger,
-- function, or RLS policy.
-- ============================================================

create or replace function kiraya.validate_exit_settlement_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    exit_organization_id uuid;
    exit_lease_id uuid;
    exit_tenant_id uuid;
begin
    select organization_id, lease_id, tenant_id
    into exit_organization_id, exit_lease_id, exit_tenant_id
    from kiraya.tenant_exits
    where id = new.tenant_exit_id;

    if exit_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement related tenant exit does not exist.';
    end if;

    if exit_organization_id is distinct from new.organization_id
       or exit_lease_id is distinct from new.lease_id
       or exit_tenant_id is distinct from new.tenant_id then
        raise exception
            using
                errcode = '23514',
                message = 'Exit settlement organization/lease/tenant mismatch with its tenant exit.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_exit_settlement_organization
before insert or update
on kiraya.exit_settlements
for each row
execute function kiraya.validate_exit_settlement_organization();
