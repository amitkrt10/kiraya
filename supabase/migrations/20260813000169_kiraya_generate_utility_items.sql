-- ============================================================
-- KIRAYA
-- Migration: generate utility items
--
-- Purpose:
-- Generates utility charges for a bill.
--
-- Supported:
--
--   FIXED
--   SUB_METER
--   SELF_METER
--
-- For metered utilities:
--
-- consumption = current reading - previous reading
--
-- amount = consumption × applicable rate
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
    -- Process unit-level utility configurations.
    -- --------------------------------------------------------

    for v_config in
        select uc.*
        from kiraya.utility_configurations uc
        where uc.organization_id = v_lease.organization_id
          and uc.unit_id = v_unit_id
          and uc.is_active = true
          and uc.effective_from <= p_period_end
          and (
              uc.effective_to is null
              or uc.effective_to >= p_period_start
          )
          and uc.is_tenant_chargeable = true
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
    'Generates fixed and metered utility bill items for a lease billing period.';