-- ============================================================
-- KIRAYA
-- Migration: billing calculation functions
--
-- Purpose:
-- Core reusable functions for rent proration and billing.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Number of calendar days in an inclusive date range
-- ------------------------------------------------------------

create or replace function kiraya.billing_period_days(
    p_start_date date,
    p_end_date date
)
returns integer
language plpgsql
immutable
security invoker
set search_path = kiraya, public
as $$
begin
    if p_end_date < p_start_date then
        raise exception
            using
                errcode = '22007',
                message = 'Billing period end date cannot be before start date.';
    end if;

    return (p_end_date - p_start_date) + 1;
end;
$$;


-- ------------------------------------------------------------
-- 2. Days in calendar month
-- ------------------------------------------------------------

create or replace function kiraya.days_in_month(
    p_date date
)
returns integer
language sql
immutable
security invoker
set search_path = kiraya, public
as $$
    select extract(
        day from (
            date_trunc('month', p_date)
            + interval '1 month'
            - interval '1 day'
        )
    )::integer;
$$;


-- ------------------------------------------------------------
-- 3. Calculate prorated rent
--
-- Example:
--
-- Monthly rent = ₹30,000
-- Month = 31 days
-- Occupancy = 10th to 31st
--
-- Chargeable days = 22
--
-- Rent = 30,000 / 31 * 22
--       = ₹21,290.32
--
-- Method:
--
-- CALENDAR_DAYS
-- FIXED_30_DAYS
-- DATE_TO_DATE
-- NONE
-- ------------------------------------------------------------

create or replace function kiraya.calculate_prorated_rent(
    p_monthly_rent numeric,
    p_period_start date,
    p_period_end date,
    p_charge_start_date date,
    p_charge_end_date date,
    p_proration_method kiraya.proration_method
)
returns numeric
language plpgsql
immutable
security invoker
set search_path = kiraya, public
as $$
declare
    chargeable_days integer;
    denominator integer;
begin

    if p_monthly_rent < 0 then
        raise exception
            using
                errcode = '22003',
                message = 'Monthly rent cannot be negative.';
    end if;

    if p_period_end < p_period_start then
        raise exception
            using
                errcode = '22007',
                message = 'Billing period is invalid.';
    end if;

    if p_charge_start_date is null
       or p_charge_end_date is null then
        return 0;
    end if;

    if p_charge_end_date < p_charge_start_date then
        return 0;
    end if;

    chargeable_days :=
        greatest(
            0,
            least(p_charge_end_date, p_period_end)
            - greatest(p_charge_start_date, p_period_start)
            + 1
        );

    if chargeable_days = 0 then
        return 0;
    end if;

    case p_proration_method

        when 'CALENDAR_DAYS' then

            denominator :=
                kiraya.billing_period_days(
                    p_period_start,
                    p_period_end
                );

            return round(
                p_monthly_rent
                * chargeable_days
                / denominator,
                2
            );


        when 'FIXED_30_DAYS' then

            denominator := 30;

            return round(
                p_monthly_rent
                * chargeable_days
                / denominator,
                2
            );


        when 'DATE_TO_DATE' then

            /*
             * For date-to-date billing the entire configured
             * period is treated as one billing period.
             */
            denominator :=
                kiraya.billing_period_days(
                    p_period_start,
                    p_period_end
                );

            return round(
                p_monthly_rent
                * chargeable_days
                / denominator,
                2
            );


        when 'NONE' then

            if chargeable_days > 0 then
                return round(p_monthly_rent, 2);
            end if;

            return 0;


        else

            raise exception
                using
                    errcode = '22023',
                    message = 'Unsupported rent proration method.';

    end case;
end;
$$;


comment on function kiraya.calculate_prorated_rent(
    numeric,
    date,
    date,
    date,
    date,
    kiraya.proration_method
) is
    'Calculates rent for the chargeable portion of a billing period.';