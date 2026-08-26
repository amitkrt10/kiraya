-- ============================================================
-- KIRAYA
-- P6.3-B: organization-consistency guards for lease_rent_rules /
-- lease_billing_configs
--
-- Problem (found during the P6.3-B security audit): every other
-- lease-child table with its own organization_id column
-- (security_deposits, tenant_exits, exit_settlements) has a BEFORE
-- INSERT OR UPDATE trigger confirming that column matches its
-- parent's own organization_id -- kiraya.leases itself has one too
-- (trg_validate_lease_organization). kiraya.lease_rent_rules and
-- kiraya.lease_billing_configs never got the equivalent guard
-- (confirmed by inspecting every trigger on
-- kiraya.organization_consistency_triggers -- these two tables are
-- the only lease-children missing from that list). Since the new
-- P6.3-B atomic assignment RPC writes to both of these tables, this
-- closes the gap before that RPC starts relying on them.
--
-- Mirrors kiraya.validate_lease_organization() exactly, just walking
-- lease_id -> leases.organization_id instead of tenant_id/unit_id.
--
-- Verified against live dev data before writing this: 0 existing
-- lease_rent_rules rows and 0 existing lease_billing_configs rows
-- have organization_id distinct from their own lease's
-- organization_id, in both local and hosted -- this migration
-- rejects no existing row.
-- ============================================================

create or replace function kiraya.validate_lease_rent_rule_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    lease_organization_id uuid;
begin
    select organization_id
    into lease_organization_id
    from kiraya.leases
    where id = new.lease_id;

    if lease_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Rent rule lease does not exist.';
    end if;

    if lease_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Rent rule organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_lease_rent_rule_organization
before insert or update
on kiraya.lease_rent_rules
for each row
execute function kiraya.validate_lease_rent_rule_organization();

create or replace function kiraya.validate_lease_billing_config_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    lease_organization_id uuid;
begin
    select organization_id
    into lease_organization_id
    from kiraya.leases
    where id = new.lease_id;

    if lease_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Billing configuration lease does not exist.';
    end if;

    if lease_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Billing configuration organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_lease_billing_config_organization
before insert or update
on kiraya.lease_billing_configs
for each row
execute function kiraya.validate_lease_billing_config_organization();
