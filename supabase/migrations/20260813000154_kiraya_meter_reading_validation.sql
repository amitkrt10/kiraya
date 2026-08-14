-- ============================================================
-- KIRAYA
-- Migration: meter reading validation
--
-- Purpose:
-- Prevents normal meter readings from going backwards.
--
-- Exceptions:
--   METER_RESET
--   METER_REPLACEMENT
--
-- In those cases a lower reading is permitted because the
-- meter counter may legitimately have restarted.
-- ============================================================

create or replace function kiraya.validate_meter_reading()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    previous_reading numeric(18,6);
    meter_organization_id uuid;
begin

    select organization_id
    into meter_organization_id
    from kiraya.meters
    where id = new.meter_id;

    if meter_organization_id is null then
        raise exception
            using
                errcode = '23503',
                message = 'Meter does not exist.';
    end if;

    if meter_organization_id is distinct from new.organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Meter reading organization mismatch.';
    end if;

    if new.reading_event_type in (
        'METER_RESET',
        'METER_REPLACEMENT'
    ) then
        return new;
    end if;

    select reading_value
    into previous_reading
    from kiraya.meter_readings
    where meter_id = new.meter_id
      and reading_date < new.reading_date
    order by reading_date desc, created_at desc
    limit 1;

    if previous_reading is not null
       and new.reading_value < previous_reading then

        raise exception
            using
                errcode = '23514',
                message = 'Meter reading cannot be lower than the previous reading.',
                detail = format(
                    'Previous reading: %s. New reading: %s.',
                    previous_reading,
                    new.reading_value
                );
    end if;

    return new;
end;
$$;

create trigger trg_validate_meter_reading
before insert or update
on kiraya.meter_readings
for each row
execute function kiraya.validate_meter_reading();

comment on function kiraya.validate_meter_reading() is
    'Prevents normal meter readings from decreasing over time.';