-- ============================================================
-- KIRAYA
-- Migration: utility/meter cross-organization reference guard
--
-- Purpose:
-- P5.5B.1 repair. A live security test found that an authenticated
-- Org B user could INSERT a utility_configurations or meters row
-- with organization_id = Org B while unit_id/property_id pointed
-- at a unit/property actually owned by a different organization
-- (Org A) — RLS only checks that the caller can write to the
-- organization_id THEY assert (their own), never that the
-- unit/property/utility they reference belongs to that same
-- organization, and the FK constraints only prove the referenced
-- row exists, not which tenant owns it.
--
-- Every other org-scoped child table in this schema already closes
-- this exact gap with a validate_*_organization() trigger
-- (validate_lease_organization, validate_security_deposit_
-- organization, validate_property_organization, validate_unit_
-- organization) — utility_configurations, meters, utility_rates,
-- and meter_reading_batches were simply never given the equivalent
-- guard. This migration adds it, mirroring those functions' exact
-- style: BEFORE INSERT OR UPDATE, SECURITY INVOKER, "parent not
-- found" -> 23503, "parent belongs to a different organization"
-- -> 23514.
--
-- kiraya.meter_readings already has adequate protection: its
-- existing validate_meter_reading() trigger's own internal lookup
-- of the meter is RLS-scoped (no SECURITY DEFINER), so a cross-org
-- meter_id resolves to NULL and hits its "Meter does not exist"
-- branch — the exact same mechanism validate_lease_organization/
-- validate_security_deposit_organization already rely on for their
-- own cross-org protection (their SELECTs are equally RLS-scoped).
-- This is a proven, intentional pattern in this codebase, not a
-- fragile accident, and needs no change here.
--
-- utilities.organization_id is nullable (a NULL means a shared/
-- system-wide utility, per utilities.is_system) — utility_id
-- references below therefore use the SAME "only reject when the
-- parent IS organization-scoped and it mismatches" exception
-- validate_property_organization() already uses for
-- property_type_id, rather than inventing a new rule.
--
-- No RLS policy is modified. No SECURITY DEFINER is introduced —
-- every function here is SECURITY INVOKER, matching every other
-- validate_*_organization() function in this schema. Nothing in
-- the current application layer writes to any of these four
-- tables yet (confirmed in the P5.5A/P5.5B investigations), so
-- this is purely additive protection with no existing legitimate
-- workflow to regress.
-- ============================================================

create or replace function kiraya.validate_utility_configuration_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_unit_organization_id uuid;
    v_unit_property_id uuid;
    v_property_organization_id uuid;
    v_utility_organization_id uuid;
begin

    if new.unit_id is not null then
        select organization_id, property_id
        into v_unit_organization_id, v_unit_property_id
        from kiraya.units
        where id = new.unit_id;

        if v_unit_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Utility configuration unit does not exist.';
        end if;

        if v_unit_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Utility configuration organization mismatch (unit).';
        end if;
    end if;

    if new.property_id is not null then
        select organization_id
        into v_property_organization_id
        from kiraya.properties
        where id = new.property_id;

        if v_property_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Utility configuration property does not exist.';
        end if;

        if v_property_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Utility configuration organization mismatch (property).';
        end if;
    end if;

    if new.unit_id is not null
       and new.property_id is not null
       and v_unit_property_id is distinct from new.property_id then

        raise exception
            using
                errcode = '23514',
                message = 'Utility configuration unit does not belong to the given property.';
    end if;

    select organization_id
    into v_utility_organization_id
    from kiraya.utilities
    where id = new.utility_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Utility configuration utility does not exist.';
    end if;

    if v_utility_organization_id is not null
       and v_utility_organization_id is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Utility configuration organization mismatch (utility).';
    end if;

    return new;
end;
$$;

create trigger trg_validate_utility_configuration_organization
before insert or update on kiraya.utility_configurations
for each row
execute function kiraya.validate_utility_configuration_organization();

comment on function kiraya.validate_utility_configuration_organization() is
    'Rejects a utility_configurations row whose unit_id/property_id/utility_id belongs to a different organization than the row itself, and rejects an inconsistent unit+property pair. Mirrors validate_lease_organization()/validate_property_organization(); utility_id follows the same globally-shared exception validate_property_organization() already uses for property_type_id.';


create or replace function kiraya.validate_meter_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_unit_organization_id uuid;
    v_unit_property_id uuid;
    v_property_organization_id uuid;
    v_utility_organization_id uuid;
begin

    if new.unit_id is not null then
        select organization_id, property_id
        into v_unit_organization_id, v_unit_property_id
        from kiraya.units
        where id = new.unit_id;

        if v_unit_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Meter unit does not exist.';
        end if;

        if v_unit_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Meter organization mismatch (unit).';
        end if;
    end if;

    if new.property_id is not null then
        select organization_id
        into v_property_organization_id
        from kiraya.properties
        where id = new.property_id;

        if v_property_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Meter property does not exist.';
        end if;

        if v_property_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Meter organization mismatch (property).';
        end if;
    end if;

    if new.unit_id is not null
       and new.property_id is not null
       and v_unit_property_id is distinct from new.property_id then

        raise exception
            using
                errcode = '23514',
                message = 'Meter unit does not belong to the given property.';
    end if;

    select organization_id
    into v_utility_organization_id
    from kiraya.utilities
    where id = new.utility_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Meter utility does not exist.';
    end if;

    if v_utility_organization_id is not null
       and v_utility_organization_id is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Meter organization mismatch (utility).';
    end if;

    return new;
end;
$$;

create trigger trg_validate_meter_organization
before insert or update on kiraya.meters
for each row
execute function kiraya.validate_meter_organization();

comment on function kiraya.validate_meter_organization() is
    'Rejects a meters row whose unit_id/property_id/utility_id belongs to a different organization than the row itself, and rejects an inconsistent unit+property pair. Same pattern as validate_utility_configuration_organization().';


create or replace function kiraya.validate_utility_rate_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_utility_organization_id uuid;
    v_config_organization_id uuid;
begin

    select organization_id
    into v_utility_organization_id
    from kiraya.utilities
    where id = new.utility_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Utility rate utility does not exist.';
    end if;

    if v_utility_organization_id is not null
       and v_utility_organization_id is distinct from new.organization_id then

        raise exception
            using
                errcode = '23514',
                message = 'Utility rate organization mismatch (utility).';
    end if;

    if new.utility_configuration_id is not null then
        select organization_id
        into v_config_organization_id
        from kiraya.utility_configurations
        where id = new.utility_configuration_id;

        if v_config_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Utility rate configuration does not exist.';
        end if;

        if v_config_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Utility rate organization mismatch (configuration).';
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_validate_utility_rate_organization
before insert or update on kiraya.utility_rates
for each row
execute function kiraya.validate_utility_rate_organization();

comment on function kiraya.validate_utility_rate_organization() is
    'Rejects a utility_rates row whose utility_id belongs to a different organization (unless the utility is a globally shared one, organization_id IS NULL), or whose utility_configuration_id belongs to a different organization (utility_configurations is always organization-owned, never global).';


create or replace function kiraya.validate_meter_reading_batch_organization()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_property_organization_id uuid;
begin

    if new.property_id is not null then
        select organization_id
        into v_property_organization_id
        from kiraya.properties
        where id = new.property_id;

        if v_property_organization_id is null then
            raise exception
                using
                    errcode = '23503',
                    message = 'Meter reading batch property does not exist.';
        end if;

        if v_property_organization_id is distinct from new.organization_id then
            raise exception
                using
                    errcode = '23514',
                    message = 'Meter reading batch organization mismatch (property).';
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_validate_meter_reading_batch_organization
before insert or update on kiraya.meter_reading_batches
for each row
execute function kiraya.validate_meter_reading_batch_organization();

comment on function kiraya.validate_meter_reading_batch_organization() is
    'Rejects a meter_reading_batches row whose property_id belongs to a different organization than the row itself.';
