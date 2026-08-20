-- ============================================================
-- KIRAYA
-- Fix: kiraya.can_access_tenant() self-referential RLS check
--
-- Root cause (P5.2C live validation, confirmed via direct SQL
-- reproduction against the linked project, not guessed):
--
-- kiraya.tenants is the only table whose SELECT policy
-- (tenants_select) calls a function that re-queries the SAME table
-- for existence:
--
--   create policy tenants_select on kiraya.tenants for select
--   using (kiraya.can_access_tenant(organization_id, id));
--
--   can_access_tenant(p_organization_id, p_tenant_id) did:
--     select exists (
--       select 1 from kiraya.tenants t
--       where t.id = p_tenant_id
--         and t.organization_id = p_organization_id
--         and (can_access_organization(p_organization_id) or is_tenant_user(p_tenant_id))
--     );
--
-- On INSERT ... RETURNING (issued by every application mutation via
-- PostgREST's `.insert().select()`), Postgres enforces the table's
-- SELECT policy against the just-inserted row within the same
-- statement. The self-referential `exists (select 1 from
-- kiraya.tenants ...)` above cannot resolve that row, so
-- can_access_tenant() returns false for a row that unambiguously
-- belongs to the caller's own organization — surfacing as a blanket
-- "new row violates row-level security policy for table tenants"
-- (42501) on the whole insert, even though tenants_insert's own
-- WITH CHECK (kiraya.can_write_organization(organization_id)) passes
-- and a bare INSERT with no RETURNING succeeds.
--
-- No other table hits this: properties_select/units_select/
-- owners_select use plain can_access_organization(organization_id)
-- (no self-query); leases_select also calls can_access_tenant(), but
-- always with an existing, already-committed tenant row from a
-- different table (kiraya.leases), never a row of kiraya.tenants
-- itself being inserted in the same statement — so it is unaffected
-- by, and unaffected by fixing, this self-reference.
--
-- Fix: remove the redundant self-existence re-check. The RLS engine
-- calling this function already guarantees the row exists — it is
-- iterating that exact row. Only the authorization condition
-- (organization membership OR active tenant-portal linkage) is kept,
-- unchanged. This is strictly equivalent for every existing caller:
--
--   * tenants_select: previously required
--       exists(row) AND (can_access_organization OR is_tenant_user)
--     "exists(row)" is guaranteed true by construction (the policy
--     evaluates this function once per real row), so it never
--     narrowed the result — dropping it changes nothing for any
--     already-visible row, and fixes the RETURNING-on-INSERT case
--     where the guarantee held but the redundant subquery could not
--     see it.
--   * leases_select: already only ever passes an existing tenant's
--     organization_id/id (via the FK-guaranteed kiraya.leases.tenant_id
--     -> kiraya.tenants.id relationship), so the self-existence check
--     there was always trivially true. Removing it does not change
--     any leases_select authorization outcome.
--
-- tenants_insert and tenants_select's own policy definitions are NOT
-- touched by this migration — only the underlying function body of
-- kiraya.can_access_tenant() changes.
-- ============================================================

create or replace function kiraya.can_access_tenant(
    p_organization_id uuid,
    p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = kiraya, public
set row_security = off
as $$
    select
        kiraya.can_access_organization(p_organization_id)
        or kiraya.is_tenant_user(p_tenant_id);
$$;
