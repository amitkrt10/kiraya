-- ============================================================
-- KIRAYA
-- P6.2-D2: automatic tenant_code generation
--
-- Tenant Code becomes fully automatic and is removed from the
-- Tenant creation/edit form entirely — the user never enters it.
-- Same PREFIX-NNN shape as Property Code (kiraya.properties,
-- derivePropertyCodePrefix()/formatPropertyCode() in
-- lib/utils/propertyCode.ts — org name stripped to ASCII
-- alphanumerics, uppercased, first 3 characters, "ORG" fallback;
-- sequence zero-padded to 3 digits), replicated here in SQL rather
-- than reused via import because, unlike Property Code, this must
-- run authoritatively server-side and never be shown/editable in a
-- form at all — Property Code's existing mechanism is a client-side,
-- non-authoritative, editable *suggestion*; Tenant Code has no
-- client involvement whatsoever, so the client-side suggestion
-- mechanism itself isn't reusable, only the format is.
--
-- Fires BEFORE INSERT only, and only when tenant_code is null or
-- blank — an explicitly-supplied tenant_code (e.g. a future bulk
-- import path) is left completely untouched, and this never fires
-- on UPDATE, so no existing tenant_code is ever changed.
--
-- Concurrency: two organization-scoped, prefix-scoped inserts
-- racing to compute "highest existing + 1" could otherwise both
-- compute the same next number. Serialized with a transaction-scoped
-- Postgres advisory lock keyed on organization_id + prefix, the same
-- established idiom kiraya.apply_tenant_credit_to_bill() already
-- uses for the structurally identical "no colliding numbers under
-- concurrency" problem (P5.20-ish). tenants_org_code_unique_idx
-- remains the actual, final guarantee regardless.
--
-- security definer + row_security off (matching every RLS helper
-- function in this schema, e.g. kiraya.can_write_organization()):
-- the numbering lookup must see every existing tenant_code for the
-- organization to compute a correct next number, regardless of which
-- specific rows RLS would otherwise let the calling role see — this
-- is not itself a write-authorization check (kiraya.tenants' own
-- tenants_insert RLS policy already gates the INSERT), only a
-- correctness guarantee for the number it picks.
-- ============================================================

create or replace function kiraya.generate_tenant_code()
returns trigger
language plpgsql
security definer
set search_path = kiraya, public
set row_security = off
as $$
declare
    v_org_name text;
    v_prefix text;
    v_highest int;
    v_lock_key bigint;
begin

    if new.tenant_code is not null and length(trim(new.tenant_code)) > 0 then
        return new;
    end if;

    select name
    into v_org_name
    from kiraya.organizations
    where id = new.organization_id;

    v_prefix := upper(left(regexp_replace(coalesce(v_org_name, ''), '[^a-zA-Z0-9]', '', 'g'), 3));
    if v_prefix = '' then
        v_prefix := 'ORG';
    end if;

    -- hashtext() of a purely alphanumeric string (v_prefix) plus the
    -- org's own uuid text is safe from any injection/formatting
    -- concern; it's only ever used as an opaque lock key, never
    -- interpolated into SQL.
    v_lock_key := hashtext(new.organization_id::text || ':' || v_prefix)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    select coalesce(max((regexp_match(tenant_code, '^' || v_prefix || '-([0-9]+)$'))[1]::int), 0)
    into v_highest
    from kiraya.tenants
    where organization_id = new.organization_id
      and tenant_code ~* ('^' || v_prefix || '-[0-9]+$');

    new.tenant_code := v_prefix || '-' || lpad((v_highest + 1)::text, 3, '0');

    return new;
end;
$$;

comment on function kiraya.generate_tenant_code() is
    'Auto-generates tenant_code as PREFIX-NNN (organization-name-derived prefix, sequential per organization+prefix) when not explicitly supplied. Never fires on UPDATE — existing tenant_code values are never changed.';

create trigger trg_generate_tenant_code
before insert on kiraya.tenants
for each row execute function kiraya.generate_tenant_code();
