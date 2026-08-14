-- ============================================================
-- KIRAYA
-- Migration: organization consistency helpers
--
-- Purpose:
-- Provides a reusable function to verify that a referenced
-- record belongs to the same organization as the current row.
--
-- This prevents accidental cross-organization relationships.
-- ============================================================

create or replace function kiraya.assert_same_organization(
    expected_organization_id uuid,
    actual_organization_id uuid
)
returns void
language plpgsql
immutable
security invoker
set search_path = kiraya, public
as $$
begin
    if expected_organization_id is distinct from actual_organization_id then
        raise exception
            using
                errcode = '23514',
                message = 'Organization mismatch',
                detail = 'Related records must belong to the same organization.';
    end if;
end;
$$;

comment on function kiraya.assert_same_organization(uuid, uuid) is
    'Raises an exception when two organization identifiers do not match.';