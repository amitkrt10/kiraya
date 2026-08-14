-- ============================================================
-- KIRAYA
-- Migration: bill generation functions
--
-- Purpose:
-- Selects the rent rule applicable to a billing period.
--
-- IMPORTANT:
-- Future rent increases are NOT automatically activated.
-- The billing engine only uses a rule that is already active
-- and effective for the billing period.
-- ============================================================

create or replace function kiraya.get_applicable_rent_rule(
    p_lease_id uuid,
    p_period_start date,
    p_period_end date
)
returns kiraya.lease_rent_rules
language plpgsql
stable
security invoker
set search_path = kiraya, public
as $$
declare
    v_rule kiraya.lease_rent_rules%rowtype;
begin

    select *
    into v_rule
    from kiraya.lease_rent_rules r
    where r.lease_id = p_lease_id
      and r.is_active = true
      and r.effective_from <= p_period_end
      and (
          r.effective_to is null
          or r.effective_to >= p_period_start
      )
    order by r.effective_from desc
    limit 1;

    if not found then
        raise exception
            using
                errcode = '23514',
                message = 'No applicable rent rule found for the billing period.';
    end if;

    return v_rule;
end;
$$;


comment on function kiraya.get_applicable_rent_rule(uuid, date, date) is
    'Returns the active rent rule applicable to a lease billing period.';