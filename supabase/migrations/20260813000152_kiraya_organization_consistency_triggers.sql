-- ============================================================
-- KIRAYA
-- Migration: organization consistency triggers
--
-- Purpose:
-- Prevents records from one organization from referencing
-- records belonging to another organization.
--
-- This is an additional integrity layer.
-- RLS will provide the security boundary later.
-- ============================================================

-- ------------------------------------------------------------
-- Properties → property type
-- ------------------------------------------------------------

create or replace function kiraya.validate_property_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    related_organization_id uuid;
begin
    if new.property_type_id is not null then
        select organization_id
        into related_organization_id
        from kiraya.property_types
        where id = new.property_type_id;

        if related_organization_id is not null
           and related_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Property type organization mismatch.';
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_validate_property_organization
before insert or update
on kiraya.properties
for each row
execute function kiraya.validate_property_organization();


-- ------------------------------------------------------------
-- Units → property / unit type
-- ------------------------------------------------------------

create or replace function kiraya.validate_unit_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    property_organization_id uuid;
    type_organization_id uuid;
begin
    select organization_id
    into property_organization_id
    from kiraya.properties
    where id = new.property_id;

    if property_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Unit property does not exist.';
    end if;

    if property_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Unit/property organization mismatch.';
    end if;

    if new.unit_type_id is not null then
        select organization_id
        into type_organization_id
        from kiraya.unit_types
        where id = new.unit_type_id;

        if type_organization_id is not null
           and type_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Unit type organization mismatch.';
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_validate_unit_organization
before insert or update
on kiraya.units
for each row
execute function kiraya.validate_unit_organization();


-- ------------------------------------------------------------
-- Property ownership → property + owner
-- ------------------------------------------------------------

create or replace function kiraya.validate_property_ownership_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    property_organization_id uuid;
    owner_organization_id uuid;
begin
    select organization_id
    into property_organization_id
    from kiraya.properties
    where id = new.property_id;

    select organization_id
    into owner_organization_id
    from kiraya.owners
    where id = new.owner_id;

    if property_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Ownership property does not exist.';
    end if;

    if owner_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Ownership owner does not exist.';
    end if;

    if property_organization_id is distinct from new.organization_id
       or owner_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Property ownership organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_property_ownership_organization
before insert or update
on kiraya.property_ownerships
for each row
execute function kiraya.validate_property_ownership_organization();


-- ------------------------------------------------------------
-- Lease → tenant + unit
-- ------------------------------------------------------------

create or replace function kiraya.validate_lease_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    tenant_organization_id uuid;
    unit_organization_id uuid;
begin
    select organization_id
    into tenant_organization_id
    from kiraya.tenants
    where id = new.tenant_id;

    select organization_id
    into unit_organization_id
    from kiraya.units
    where id = new.unit_id;

    if tenant_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Lease tenant does not exist.';
    end if;

    if unit_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Lease unit does not exist.';
    end if;

    if tenant_organization_id is distinct from new.organization_id
       or unit_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Lease organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_lease_organization
before insert or update
on kiraya.leases
for each row
execute function kiraya.validate_lease_organization();


-- ------------------------------------------------------------
-- Payment → tenant + payment method
-- ------------------------------------------------------------

create or replace function kiraya.validate_payment_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    tenant_organization_id uuid;
    method_organization_id uuid;
begin
    select organization_id
    into tenant_organization_id
    from kiraya.tenants
    where id = new.tenant_id;

    select organization_id
    into method_organization_id
    from kiraya.payment_methods
    where id = new.payment_method_id;

    if tenant_organization_id is null
       or method_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Payment related record does not exist.';
    end if;

    if tenant_organization_id is distinct from new.organization_id
       or method_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Payment organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_payment_organization
before insert or update
on kiraya.payments
for each row
execute function kiraya.validate_payment_organization();


-- ------------------------------------------------------------
-- Bill → lease + tenant + unit
-- ------------------------------------------------------------

create or replace function kiraya.validate_bill_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    lease_organization_id uuid;
    tenant_organization_id uuid;
    unit_organization_id uuid;
begin
    select organization_id
    into lease_organization_id
    from kiraya.leases
    where id = new.lease_id;

    select organization_id
    into tenant_organization_id
    from kiraya.tenants
    where id = new.tenant_id;

    select organization_id
    into unit_organization_id
    from kiraya.units
    where id = new.unit_id;

    if lease_organization_id is null
       or tenant_organization_id is null
       or unit_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Bill related record does not exist.';
    end if;

    if lease_organization_id is distinct from new.organization_id
       or tenant_organization_id is distinct from new.organization_id
       or unit_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Bill organization mismatch.';
    end if;

    return new;
end;
$$;

create trigger trg_validate_bill_organization
before insert or update
on kiraya.bills
for each row
execute function kiraya.validate_bill_organization();


-- ------------------------------------------------------------
-- Security deposit → lease + tenant
-- ------------------------------------------------------------

create or replace function kiraya.validate_security_deposit_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    lease_organization_id uuid;
    tenant_organization_id uuid;
begin
    select organization_id
    into lease_organization_id
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

    return new;
end;
$$;

create trigger trg_validate_security_deposit_organization
before insert or update
on kiraya.security_deposits
for each row
execute function kiraya.validate_security_deposit_organization();