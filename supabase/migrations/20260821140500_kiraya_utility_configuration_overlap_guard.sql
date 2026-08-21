-- ============================================================
-- KIRAYA
-- Migration: utility configuration overlap guard
--
-- Purpose:
-- P5.5B Defect B repair (part 1 of 2). Prevents two ACTIVE,
-- tenant-chargeable utility_configurations rows from having
-- overlapping effective-date windows for the same
-- organization + utility + scope (unit or property), which
-- would otherwise let generate_utility_bill_items() generate
-- two bill_items for the same charge in the same period.
--
-- Design:
--   - Property-level and unit-level configurations are DIFFERENT
--     scopes and are allowed to coexist for the same utility
--     (unit overrides property at billing time — see the
--     generate_utility_bill_items() migration that follows this
--     one). This constraint only prevents overlap WITHIN the
--     same scope (two unit-level rows for the same unit, or two
--     property-level rows for the same property), for the same
--     utility.
--   - Scope identity is expressed as (scope_type, scope_id) so a
--     unit-scoped row can never collide with a property-scoped
--     row even though unit_id/property_id live in different
--     columns.
--   - effective_from/effective_to become a daterange with an
--     inclusive upper bound (matching the existing
--     utility_configurations_date_check semantics: effective_to
--     >= effective_from); a NULL effective_to is naturally
--     unbounded via Postgres's own range-constructor NULL
--     handling — no CASE logic needed.
--   - Only rows that could actually double-charge a tenant
--     (is_active AND is_tenant_chargeable) are constrained, so a
--     superseded config can be deactivated (not deleted) without
--     conflicting with its replacement, and non-chargeable
--     tracking-only configurations remain unconstrained.
--   - An EXCLUDE constraint (not a trigger) is used deliberately:
--     it is backed by an index, so two concurrent INSERTs of
--     overlapping configurations are serialized/rejected by
--     Postgres itself the same way a unique index handles
--     concurrent duplicate inserts — a check-then-insert trigger
--     would have a TOCTOU race here, an index-backed constraint
--     does not.
-- ============================================================

create extension if not exists btree_gist with schema extensions;

alter table kiraya.utility_configurations
add constraint utility_configurations_no_active_overlap
exclude using gist (
    organization_id with =,
    utility_id with =,
    (case when unit_id is not null then 'UNIT' else 'PROPERTY' end) with =,
    coalesce(unit_id, property_id) with =,
    daterange(effective_from, effective_to, '[]') with &&
)
where (is_active and is_tenant_chargeable);

comment on constraint utility_configurations_no_active_overlap on kiraya.utility_configurations is
    'Prevents two active, tenant-chargeable configurations for the same organization+utility+scope (unit or property) from having overlapping effective-date windows. Property-level and unit-level rows for the same utility are a different scope and may coexist — precedence between them is resolved by generate_utility_bill_items(), not by this constraint.';


-- ============================================================
-- P5.5B Defect B repair (part 2 of 2). Utility-item identity.
--
-- Exactly one UTILITY-type bill_item may exist per (bill,
-- utility) regardless of whether it was charged as FIXED or
-- metered — generate_utility_bill_items() resolves exactly one
-- applicable configuration per utility per bill (see the
-- following migration), so this is a hard backstop: even if that
-- function had a bug reintroducing a duplicate, this index
-- rejects it at INSERT time rather than silently succeeding.
-- ============================================================

create unique index bill_items_utility_bill_unique_idx
on kiraya.bill_items (bill_id, utility_id)
where item_type = 'UTILITY';

comment on index kiraya.bill_items_utility_bill_unique_idx is
    'At most one UTILITY bill_item per (bill, utility) — the authoritative identity of a generated utility charge.';
