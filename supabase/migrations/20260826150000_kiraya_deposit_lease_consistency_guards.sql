-- ============================================================
-- KIRAYA
-- P6.2-D1: deposit/refund lease-consistency guards
--
-- Problem (found during the P6.2-D1 lease-scoping audit):
--
-- 1. kiraya.validate_security_deposit_organization() (the BEFORE INSERT
--    OR UPDATE trigger on kiraya.security_deposits) only checks that
--    lease_id and tenant_id each belong to this organization -- it never
--    checks that they belong to EACH OTHER, i.e. that
--    security_deposits.tenant_id actually equals
--    leases.tenant_id for security_deposits.lease_id. Nothing in the
--    schema stops a deposit row from being created with a tenant_id
--    that doesn't match its own lease's tenant.
--
-- 2. kiraya.deposit_refunds has no cross-consistency check at all
--    between security_deposit_id and tenant_exit_id. kiraya.
--    validate_deposit_refund_cap() only caps the refund amount against
--    the deposit's own held balance -- it never confirms the deposit
--    being refunded actually belongs to the same lease/occupancy as the
--    exit it's being refunded through. Since one tenant can hold
--    multiple leases (one per unit, each with its own security deposit
--    per security_deposits_lease_unique_idx), nothing at the database
--    layer currently prevents an exit for Unit A's lease from recording
--    a deposit_refunds row against Unit B's deposit, as long as both
--    belong to the same tenant/organization (RLS is org/tenant-scoped
--    only, via can_access_tenant/can_write_organization -- never
--    lease-scoped). The P6.2-D1 application-layer fix (deriving the
--    deposit from the exit's own lease_id, never from tenant_id alone)
--    closes this in the UI/action layer; this migration closes it at
--    the database layer too, so it holds even if a future caller
--    regresses back to a tenant-only lookup.
--
-- Both checks mirror an already-established pattern in this schema:
-- kiraya.validate_security_deposit_transaction() already performs the
-- identical "does this row's lease_id match the deposit's own lease_id"
-- check for kiraya.security_deposit_transactions. This migration brings
-- security_deposits and deposit_refunds up to the same standard, no new
-- columns or constraints, pure additive BEFORE INSERT/UPDATE validation.
--
-- Verified safe against live dev data before writing this: zero existing
-- kiraya.security_deposits rows have tenant_id distinct from their
-- lease's tenant_id (0/28), and zero existing kiraya.deposit_refunds
-- rows have a security_deposit whose lease_id differs from their
-- tenant_exit's lease_id (0/8) -- this migration rejects no existing
-- row on its next update.
-- ============================================================

-- ------------------------------------------------------------
-- 1. security_deposits: tenant must match the lease's own tenant.
-- ------------------------------------------------------------

create or replace function kiraya.validate_security_deposit_organization()
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
                message = 'Security deposit related record does not exist.';
    end if;

    if lease_organization_id is distinct from new.organization_id
       or tenant_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Security deposit organization mismatch.';
    end if;

    if lease_tenant_id is distinct from new.tenant_id then
        raise exception
            using
                errcode = '23514',
                message = 'Security deposit tenant does not match the lease''s own tenant.';
    end if;

    return new;
end;
$$;

comment on function kiraya.validate_security_deposit_organization() is
    'Validates organization consistency across lease/tenant/deposit, and (P6.2-D1) that tenant_id matches the lease''s own tenant_id.';

-- ------------------------------------------------------------
-- 2. deposit_refunds: the deposit being refunded must belong to the
--    same lease (and tenant) as the exit it's being refunded through.
-- ------------------------------------------------------------

create or replace function kiraya.validate_deposit_refund_lease_consistency()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $$
declare
    v_deposit kiraya.security_deposits%rowtype;
    v_exit kiraya.tenant_exits%rowtype;
begin

    select *
    into v_deposit
    from kiraya.security_deposits
    where id = new.security_deposit_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Security deposit does not exist.';
    end if;

    select *
    into v_exit
    from kiraya.tenant_exits
    where id = new.tenant_exit_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Tenant exit does not exist.';
    end if;

    if v_deposit.lease_id is distinct from v_exit.lease_id then
        raise exception
            using
                errcode = '23514',
                message = 'Deposit refund lease mismatch: the security deposit does not belong to this exit''s occupancy.',
                detail = format(
                    'Deposit lease: %s. Exit lease: %s.',
                    v_deposit.lease_id,
                    v_exit.lease_id
                );
    end if;

    if v_deposit.tenant_id is distinct from new.tenant_id
       or v_exit.tenant_id is distinct from new.tenant_id then
        raise exception
            using
                errcode = '23514',
                message = 'Deposit refund tenant mismatch.';
    end if;

    return new;
end;
$$;

comment on function kiraya.validate_deposit_refund_lease_consistency() is
    'P6.2-D1: rejects a deposit_refunds row whose security_deposit does not belong to the same lease/occupancy as its tenant_exit -- closes the "exit for Unit A refunding Unit B''s deposit" gap at the database layer.';

drop trigger if exists trg_validate_deposit_refund_lease_consistency
on kiraya.deposit_refunds;

create trigger trg_validate_deposit_refund_lease_consistency
before insert or update on kiraya.deposit_refunds
for each row execute function kiraya.validate_deposit_refund_lease_consistency();
