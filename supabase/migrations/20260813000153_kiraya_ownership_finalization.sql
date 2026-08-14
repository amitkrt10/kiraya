-- ============================================================
-- KIRAYA
-- Migration: ownership finalization
--
-- Purpose:
-- Provides a function to verify that a property has exactly
-- 100% ownership allocated.
--
-- We do NOT force 100% on every INSERT/UPDATE because users
-- need to be able to edit ownership records.
--
-- The application must call this before treating ownership
-- as finalized.
-- ============================================================

create or replace function kiraya.validate_property_ownership_complete(
    p_property_id uuid,
    p_as_of_date date default current_date
)
returns boolean
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
    where property_id = p_property_id
      and (
          ownership_start_date is null
          or ownership_start_date <= p_as_of_date
      )
      and (
          ownership_end_date is null
          or ownership_end_date >= p_as_of_date
      );

    return total_percentage = 100;
end;
$$;

comment on function kiraya.validate_property_ownership_complete(uuid, date) is
    'Returns true only when active ownership percentages total exactly 100%.';