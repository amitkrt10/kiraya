-- ============================================================
-- KIRAYA
-- Migration: updated_at function
--
-- Purpose:
-- Automatically maintain updated_at timestamps.
-- ============================================================

create or replace function kiraya.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function kiraya.set_updated_at() is
    'Automatically updates updated_at before a row is updated.';