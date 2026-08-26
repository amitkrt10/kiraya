-- ============================================================
-- KIRAYA
-- P6.3-B: rent rule overlap guard
--
-- Problem (P6.3-A audit): kiraya.get_applicable_rent_rule() picks
-- the ACTIVE rule with the latest effective_from covering a billing
-- period, but nothing ever stopped two ACTIVE rules for the same
-- lease from having overlapping effective periods in the first
-- place -- their "resolution" was only ever get_applicable_rent_
-- rule()'s own tie-break, an implicit behavior, not a guarantee.
--
-- Fix, in two parts:
--
-- 1. kiraya.close_previous_rent_rule_on_insert() (BEFORE INSERT):
--    when a new ACTIVE rule is inserted, automatically closes an
--    OTHER active rule for the same lease that is still genuinely
--    OPEN-ENDED (effective_to is null) and started earlier -- by
--    setting that rule's effective_to to the day before the new
--    rule's effective_from. This is exactly the "supersede" case a
--    rent revision is meant to express (old rule 2026-01-01 -> open,
--    new rule 2027-01-01 -> open becomes old rule 2026-01-01 ->
--    2026-12-31, new rule 2027-01-01 -> open) and requires no second
--    step from the caller.
--
--    Deliberately scoped to effective_to IS NULL only -- an existing
--    rule that already has its own finite effective_to was closed on
--    purpose (by an earlier revision, or set explicitly) and must
--    never be silently re-truncated by an unrelated later insert; an
--    insert whose range genuinely overlaps such a rule is a
--    real conflict and is correctly left for the exclusion
--    constraint below to reject, not something to paper over by
--    moving someone else's boundary. (Caught live during this
--    checkpoint's own testing: an earlier, broader version of this
--    trigger that ignored the target's existing effective_to
--    truncated an unrelated rule's real end date to accommodate a
--    clearly-invalid backdated insert, opening a silent coverage gap
--    -- this scoping is what prevents that.)
--
--    A rule inserted with an effective_from EARLIER than an existing
--    active rule's is never auto-adjusted in that direction either --
--    that's an ambiguous, out-of-order case left to the exclusion
--    constraint below to reject outright rather than guess at.
--
--    Never touches inactive rules, and never touches a rule row that
--    isn't being directly superseded -- historical rules already
--    closed (effective_to already set, not covering the new rule's
--    start) are left completely alone. Existing bill_items are
--    unaffected regardless: kiraya.generate_rent_bill_item() already
--    snapshots rent_rule_id/monthly_rent into each bill_item's own
--    metadata at generation time, so a later change to a rule's
--    effective_to (or a new rule entirely) can never retroactively
--    change what an already-generated bill shows.
--
-- 2. lease_rent_rules_no_active_overlap: a GIST exclusion constraint
--    (btree_gist, already enabled by the existing
--    utility_configurations_no_active_overlap precedent) that
--    rejects two ACTIVE rules for the same lease with overlapping
--    effective daterange, full stop -- the auto-close trigger
--    resolves the common "revise rent" case before this constraint
--    is ever reached, and this constraint is what makes "two
--    overlapping periods silently coexisting" actually impossible
--    rather than just discouraged.
--
-- Verified against live dev data before writing this: exactly one
-- conflicting pair existed (hosted only, E2E_ORG_A synthetic fixture
-- lease ed3cf53f-8e33-4fc0-9f9d-c87ff56742cd -- two identical
-- duplicate "Base Rent" rules, both effective 2026-01-01, open-
-- ended). Per explicit user direction, the newer duplicate
-- (9140f877-4dc1-42b2-bbbc-6ed40a10a91b) was deactivated (is_active
-- = false) before this migration -- not deleted, zero rows removed,
-- fully reversible. Reverified zero conflicts remain in both
-- local and hosted before writing this constraint.
-- ============================================================

create extension if not exists btree_gist with schema extensions;

create or replace function kiraya.close_previous_rent_rule_on_insert()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $$
begin
    if new.is_active then
        update kiraya.lease_rent_rules
        set effective_to = new.effective_from - 1,
            updated_at = now()
        where lease_id = new.lease_id
          and id <> new.id
          and is_active = true
          and effective_to is null
          and effective_from < new.effective_from;
    end if;

    return new;
end;
$$;

comment on function kiraya.close_previous_rent_rule_on_insert() is
    'P6.3-B: auto-closes an existing active rent rule that a newly-inserted later rule supersedes, so a straightforward rent revision (insert one new row) never needs a manual second step to avoid the overlap exclusion constraint.';

create trigger trg_close_previous_rent_rule_on_insert
before insert on kiraya.lease_rent_rules
for each row execute function kiraya.close_previous_rent_rule_on_insert();

alter table kiraya.lease_rent_rules
add constraint lease_rent_rules_no_active_overlap
exclude using gist (
    lease_id with =,
    daterange(effective_from, effective_to, '[]') with &&
)
where (is_active);

comment on constraint lease_rent_rules_no_active_overlap on kiraya.lease_rent_rules is
    'P6.3-B: prevents two ACTIVE rent rules for the same lease from having overlapping effective-date windows. The auto-close trigger (trg_close_previous_rent_rule_on_insert) resolves the ordinary "revise rent forward" case before this constraint is reached; an out-of-order or genuinely ambiguous insert is rejected here instead of silently guessed at.';
