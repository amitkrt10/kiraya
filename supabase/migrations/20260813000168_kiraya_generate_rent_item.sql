-- ============================================================
-- KIRAYA
-- Migration: generate rent item
--
-- Purpose:
-- Generates the rent line for a bill.
-- ============================================================

create or replace function kiraya.generate_rent_bill_item(
    p_bill_id uuid,
    p_lease_id uuid,
    p_period_start date,
    p_period_end date
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_rule kiraya.lease_rent_rules%rowtype;

    v_config kiraya.lease_billing_configs%rowtype;

    v_charge_start date;
    v_charge_end date;

    v_amount numeric(18,2);

    v_item_id uuid;
begin

    select *
    into v_config
    from kiraya.lease_billing_configs
    where lease_id = p_lease_id
      and is_active = true
      and effective_from <= p_period_end
      and (
          effective_to is null
          or effective_to >= p_period_start
      )
    order by effective_from desc
    limit 1;

    if not found then
        raise exception
            using
                errcode = '23514',
                message = 'No active billing configuration found for lease.';
    end if;


    v_rule :=
        kiraya.get_applicable_rent_rule(
            p_lease_id,
            p_period_start,
            p_period_end
        );


    v_charge_start :=
        kiraya.get_lease_charge_start(
            p_lease_id,
            p_period_start
        );


    v_charge_end :=
        kiraya.get_lease_charge_end(
            p_lease_id,
            p_period_end
        );


    v_amount :=
        kiraya.calculate_prorated_rent(
            v_rule.monthly_rent,
            p_period_start,
            p_period_end,
            v_charge_start,
            v_charge_end,
            v_config.proration_method
        );


    insert into kiraya.bill_items (
        organization_id,
        bill_id,
        item_type,
        description,
        quantity,
        unit_name,
        unit_rate,
        amount,
        metadata
    )
    select
        b.organization_id,
        b.id,
        'RENT',
        case
            when v_charge_start > p_period_start
              or v_charge_end < p_period_end
            then
                format(
                    'Prorated rent (%s to %s)',
                    v_charge_start,
                    v_charge_end
                )
            else
                'Monthly rent'
        end,
        1,
        'month',
        v_rule.monthly_rent,
        v_amount,
        jsonb_build_object(
            'rent_rule_id', v_rule.id,
            'monthly_rent', v_rule.monthly_rent,
            'proration_method', v_config.proration_method,
            'period_start', p_period_start,
            'period_end', p_period_end,
            'charge_start', v_charge_start,
            'charge_end', v_charge_end,
            'chargeable_days',
                case
                    when v_charge_end >= v_charge_start
                    then v_charge_end - v_charge_start + 1
                    else 0
                end
        )
    from kiraya.bills b
    where b.id = p_bill_id
    returning id into v_item_id;


    return v_item_id;
end;
$$;


comment on function kiraya.generate_rent_bill_item(
    uuid,
    uuid,
    date,
    date
) is
    'Generates the rent bill item using the applicable rent rule and proration configuration.';