-- ============================================================
-- KIRAYA
-- Migration: ownership validation
--
-- Purpose:
-- Ensures active ownership percentages for a property do not
-- exceed 100%.
--
-- We intentionally allow temporary totals below 100% while
-- users are editing ownership records.
--
-- Finalized property ownership should equal exactly 100%.
-- That final validation will be handled separately.
-- ============================================================

create or replace function kiraya.validate_property_ownership_percentage()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    total_percentage numeric(12,4);
begin

    select coalesce(sum(ownership_percentage), 0)
    into total_percentage
    from kiraya.property_ownerships
    where property_id = new.property_id
      and id <> new.id
      and (
          ownership_end_date is null
          or ownership_end_date >= current_date
      )
      and (
          ownership_start_date is null
          or ownership_start_date <= current_date
      );

    total_percentage :=
        total_percentage + new.ownership_percentage;

    if total_percentage > 100 then
        raise exception
            using
                errcode = '23514',
                message = 'Property ownership exceeds 100%',
                detail = format(
                    'Property %s would have total ownership of %s%%.',
                    new.property_id,
                    total_percentage
                );
    end if;

    return new;
end;
$$;

create trigger trg_validate_property_ownership_percentage
before insert or update
on kiraya.property_ownerships
for each row
execute function kiraya.validate_property_ownership_percentage();

comment on function kiraya.validate_property_ownership_percentage() is
    'Prevents active property ownership percentages from exceeding 100%.';