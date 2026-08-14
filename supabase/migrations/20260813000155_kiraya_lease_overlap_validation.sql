-- ============================================================
-- KIRAYA
-- Migration: lease overlap validation
--
-- Purpose:
-- Prevents overlapping occupancy periods for the same unit.
--
-- A tenant can have multiple leases over time.
--
-- Example:
--
-- Lease A: 01-Jan → 31-Dec
-- Lease B: 01-Jan → 31-Dec
--
-- NOT allowed for the same unit.
--
-- Lease A: 01-Jan → 31-Dec
-- Lease B: 01-Jan next year → 31-Dec next year
--
-- Allowed.
--
-- DRAFT and CANCELLED leases do not block occupancy.
-- ============================================================

create or replace function kiraya.validate_lease_overlap()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    conflicting_lease_id uuid;
    effective_new_end date;
begin

    -- Cancelled leases do not reserve occupancy.
    if new.status = 'CANCELLED' then
        return new;
    end if;

    /*
     * An open-ended lease is treated as extending indefinitely.
     * For PostgreSQL daterange we use a NULL upper bound.
     */
    select l.id
    into conflicting_lease_id
    from kiraya.leases l
    where l.id <> new.id
      and l.unit_id = new.unit_id
      and l.status in (
          'ACTIVE',
          'ENDED',
          'DRAFT'
      )
      and daterange(
          l.occupancy_start_date,
          coalesce(l.actual_end_date, l.agreement_end_date) + 1,
          '[)'
      )
      &&
      daterange(
          new.occupancy_start_date,
          coalesce(new.actual_end_date, new.agreement_end_date) + 1,
          '[)'
      )
    limit 1;

    if conflicting_lease_id is not null then
        raise exception
            using
                errcode = '23P01',
                message = 'Lease occupancy period overlaps another lease for this unit.',
                detail = format(
                    'Conflicting lease ID: %s.',
                    conflicting_lease_id
                );
    end if;

    return new;
end;
$$;

create trigger trg_validate_lease_overlap
before insert or update
on kiraya.leases
for each row
execute function kiraya.validate_lease_overlap();

comment on function kiraya.validate_lease_overlap() is
    'Prevents overlapping lease occupancy periods for the same unit.';