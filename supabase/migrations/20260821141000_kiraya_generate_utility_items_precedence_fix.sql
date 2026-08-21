-- ============================================================
-- KIRAYA
-- Migration: generate_utility_bill_items precedence + idempotency
--
-- Purpose:
-- P5.5B repair of Defects B and C.
--
--   Defect C: property-level utility_configurations were never
--   considered at all (the function only ever matched
--   uc.unit_id = v_unit_id) — a utility configured at the
--   property level was silently never billed to any tenant.
--
--   Defect B (generation side): even after the overlap-guard
--   migration makes overlapping *active* configs within the same
--   scope impossible, a unit can still legitimately have BOTH a
--   property-level AND a unit-level configuration for the SAME
--   utility (different scopes, intentionally allowed) — exactly
--   one of them must contribute a charge, with the unit-level one
--   taking precedence. And a second invocation of this function
--   against a bill_id that already has utility items must not
--   duplicate them.
--
-- Precedence rule (approved in P5.5B):
--   UNIT-LEVEL configuration overrides PROPERTY-LEVEL
--   configuration for the same utility and billing period.
--   Property-level is the default when no unit-level override
--   exists for that utility.
--
-- Idempotency: the very first thing this function does is lock
-- the target bill row and check whether it already has any
-- UTILITY bill_item. If so, it returns 0 and does nothing further
-- — a clean no-op, never a delete/recalculate. The lock (matching
-- the same for-update pattern generate_bill() already uses on its
-- own parent row) closes the same concurrent-double-invocation
-- race the overlap guard closes for configurations.
-- bill_items_utility_bill_unique_idx (added in the previous
-- migration) is the hard backstop if this check were ever
-- bypassed.
--
-- Everything else — meter selection, rate selection, consumption
-- calculation, bill_items column values — is UNCHANGED from the
-- existing, already-correct logic; only how v_config rows are
-- selected has changed.
-- ============================================================

create or replace function kiraya.generate_utility_bill_items(
    p_bill_id uuid,
    p_lease_id uuid,
    p_period_start date,
    p_period_end date
)
returns integer
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_lease kiraya.leases%rowtype;

    v_property_id uuid;

    v_config kiraya.utility_configurations%rowtype;

    v_meter kiraya.meters%rowtype;

    v_current_reading numeric(18,6);
    v_previous_reading numeric(18,6);

    v_consumption numeric(18,6);

    v_rate numeric(18,6);

    v_amount numeric(18,2);

    v_count integer := 0;

    v_unit_id uuid;
begin

    select *
    into v_lease
    from kiraya.leases
    where id = p_lease_id;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Lease does not exist.';
    end if;


    v_unit_id := v_lease.unit_id;


    -- --------------------------------------------------------
    -- Idempotency guard. Lock the bill row (same pattern
    -- generate_bill() uses on the lease) so two concurrent
    -- invocations against the same bill_id serialize; if utility
    -- items already exist for this bill, this is a no-op.
    -- --------------------------------------------------------

    perform 1
    from kiraya.bills
    where id = p_bill_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;

    if exists (
        select 1
        from kiraya.bill_items
        where bill_id = p_bill_id
          and item_type = 'UTILITY'
    ) then
        return 0;
    end if;


    select property_id
    into v_property_id
    from kiraya.units
    where id = v_unit_id;


    -- --------------------------------------------------------
    -- Resolve exactly one applicable configuration per utility:
    -- a unit-level row for that utility if one exists, otherwise
    -- the property-level row for that utility. The overlap-guard
    -- exclusion constraint guarantees at most one active,
    -- chargeable row per scope+utility+period, so within each
    -- utility_id group there are at most two candidates (one
    -- unit-scoped, one property-scoped) and the ordering below
    -- deterministically prefers the unit-scoped one.
    -- --------------------------------------------------------

    for v_config in
        select distinct on (uc.utility_id) uc.*
        from kiraya.utility_configurations uc
        where uc.organization_id = v_lease.organization_id
          and uc.is_active = true
          and uc.is_tenant_chargeable = true
          and uc.effective_from <= p_period_end
          and (
              uc.effective_to is null
              or uc.effective_to >= p_period_start
          )
          and (
              uc.unit_id = v_unit_id
              or (
                  uc.unit_id is null
                  and uc.property_id = v_property_id
              )
          )
        order by
            uc.utility_id,
            (uc.unit_id is not null) desc
    loop

        -- ----------------------------------------------------
        -- FIXED utility
        -- ----------------------------------------------------

        if v_config.meter_type = 'FIXED' then

            insert into kiraya.bill_items (
                organization_id,
                bill_id,
                item_type,
                description,
                utility_id,
                quantity,
                unit_name,
                unit_rate,
                amount,
                metadata
            )
            select
                v_lease.organization_id,
                p_bill_id,
                'UTILITY',
                u.name,
                u.id,
                1,
                coalesce(u.unit_name, 'month'),
                v_config.fixed_amount,
                round(v_config.fixed_amount, 2),
                jsonb_build_object(
                    'utility_configuration_id', v_config.id,
                    'meter_type', 'FIXED'
                )
            from kiraya.utilities u
            where u.id = v_config.utility_id;

            v_count := v_count + 1;

            continue;
        end if;


        -- ----------------------------------------------------
        -- Metered utility
        -- ----------------------------------------------------

        select *
        into v_meter
        from kiraya.meters m
        where m.unit_id = v_unit_id
          and m.utility_id = v_config.utility_id
          and m.is_active = true
          and (
              m.installed_on is null
              or m.installed_on <= p_period_end
          )
          and (
              m.removed_on is null
              or m.removed_on >= p_period_start
          )
        order by m.installed_on desc nulls last
        limit 1;

        if not found then
            continue;
        end if;


        -- Current reading.
        select reading_value
        into v_current_reading
        from kiraya.meter_readings
        where meter_id = v_meter.id
          and reading_date <= p_period_end
        order by reading_date desc, created_at desc
        limit 1;


        -- Previous reading.
        select reading_value
        into v_previous_reading
        from kiraya.meter_readings
        where meter_id = v_meter.id
          and reading_date < p_period_start
        order by reading_date desc, created_at desc
        limit 1;


        if v_current_reading is null then
            continue;
        end if;


        if v_previous_reading is null then
            v_previous_reading := coalesce(
                v_meter.initial_reading,
                v_current_reading
            );
        end if;


        v_consumption :=
            greatest(
                0,
                (
                    v_current_reading
                    - v_previous_reading
                )
                * v_meter.multiplier
            );


        select ur.rate
        into v_rate
        from kiraya.utility_rates ur
        where ur.utility_id = v_config.utility_id
          and ur.is_active = true
          and ur.effective_from <= p_period_end
          and (
              ur.effective_to is null
              or ur.effective_to >= p_period_start
          )
        order by ur.effective_from desc
        limit 1;


        if v_rate is null then
            continue;
        end if;


        v_amount :=
            round(
                v_consumption * v_rate,
                2
            );


        insert into kiraya.bill_items (
            organization_id,
            bill_id,
            item_type,
            description,
            utility_id,
            meter_id,
            quantity,
            unit_name,
            unit_rate,
            amount,
            metadata
        )
        select
            v_lease.organization_id,
            p_bill_id,
            'UTILITY',
            u.name,
            u.id,
            v_meter.id,
            v_consumption,
            coalesce(
                u.unit_name,
                v_meter.unit_name,
                'unit'
            ),
            v_rate,
            v_amount,
            jsonb_build_object(
                'utility_configuration_id', v_config.id,
                'meter_id', v_meter.id,
                'previous_reading', v_previous_reading,
                'current_reading', v_current_reading,
                'multiplier', v_meter.multiplier,
                'consumption', v_consumption,
                'rate', v_rate
            )
        from kiraya.utilities u
        where u.id = v_config.utility_id;


        v_count := v_count + 1;

    end loop;


    return v_count;
end;
$$;

comment on function kiraya.generate_utility_bill_items(
    uuid,
    uuid,
    date,
    date
) is
    'Generates fixed and metered utility bill items for a lease billing period. Resolves exactly one configuration per utility (unit-level overrides property-level); idempotent no-op if utility items already exist for the target bill.';
