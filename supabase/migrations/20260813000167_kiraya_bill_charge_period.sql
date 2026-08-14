-- ============================================================
-- KIRAYA
-- Migration: bill charge period
--
-- Purpose:
-- Determines the portion of a billing period for which the
-- tenant is chargeable.
--
-- This handles:
--
--   Tenant starts on 10th
--   Billing period = 1st → 31st
--   Charge period = 10th → 31st
--
-- It also handles tenant exits.
-- ============================================================

create or replace function kiraya.get_lease_charge_start(
    p_lease_id uuid,
    p_period_start date
)
returns date
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        p_period_start,
        occupancy_start_date
    )
    from kiraya.leases
    where id = p_lease_id;
$$;


create or replace function kiraya.get_lease_charge_end(
    p_lease_id uuid,
    p_period_end date
)
returns date
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select least(
        p_period_end,
        coalesce(actual_end_date, agreement_end_date, p_period_end)
    )
    from kiraya.leases
    where id = p_lease_id;
$$;


comment on function kiraya.get_lease_charge_start(uuid, date) is
    'Returns the first chargeable date within a billing period.';


comment on function kiraya.get_lease_charge_end(uuid, date) is
    'Returns the final chargeable date within a billing period.';