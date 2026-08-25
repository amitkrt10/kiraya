-- ============================================================
-- KIRAYA
-- P5.18: tenant exit reference generation concurrency fix
--
-- Problem (confirmed via repeated local E2E reproduction, P5.17/P5.18):
-- lib/mutations/tenantExits.ts generated exit_reference,
-- settlement_reference, and refund_reference (x2) values in
-- application code via a second-granularity timestamp string
-- (generateReference()). Two legitimate concurrent mutations for the
-- same organization within the same wall-clock second produced
-- identical reference strings, tripping the org-scoped unique
-- indexes below and surfacing as "That exit reference already
-- exists -- try again." to real users. This is a genuine production
-- defect, not a test artifact.
--
-- Fix: move reference generation into the database via a
-- sequence-backed column DEFAULT. nextval() is exempt from MVCC/
-- transaction-rollback semantics -- two concurrent transactions can
-- never receive the same value from it regardless of timing, which
-- second-granularity JS timestamps (even with added precision or
-- randomness) cannot guarantee. Application code no longer supplies
-- these four columns on INSERT; Postgres fills them in atomically at
-- insert time via the default expression below.
--
-- Format is unchanged in spirit (PREFIX-YYYYMMDD-<counter>), so
-- existing UI display, filters (`ilike 'EXIT-%'`, `/^EXIT-/` in
-- tests/e2e), and every historical row remain valid -- only the
-- suffix segment changes: a second-precision clock reading is
-- replaced with a strictly monotonic, collision-proof sequence
-- value. Confirmed (P5.18 investigation) that nothing in the app
-- parses the date portion out of any of these reference strings --
-- every read site treats them as opaque display/search strings.
--
-- A single shared sequence is used across all four prefixes (EXIT/
-- SET/REF/CRF) rather than one sequence per prefix: simpler (one
-- sequence, one generator function, reused by four column defaults),
-- and functionally equivalent for both the uniqueness guarantee and
-- human readability -- only difference is per-prefix numbering isn't
-- gapless, which the existing "no client-side generation" contract
-- of these fields never made an assumption about.
--
-- Existing unique indexes (tenant_exits_org_reference_unique_idx,
-- exit_settlements_org_reference_unique_idx,
-- deposit_refunds_org_reference_unique_idx,
-- tenant_credit_refunds_org_reference_unique_idx), NOT NULL
-- constraints, and non-empty check constraints on all four columns
-- are untouched -- this migration only adds a DEFAULT expression,
-- it does not relax or replace any existing guarantee.
-- ============================================================

create sequence if not exists kiraya.reference_seq;

create or replace function kiraya.generate_sequential_reference(p_prefix text)
returns text
language sql
volatile
set search_path = kiraya, public
as $$
    select p_prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' ||
           lpad(nextval('kiraya.reference_seq')::text, 6, '0');
$$;

comment on function kiraya.generate_sequential_reference(text) is
    'Generates a human-readable, database-atomic, concurrency-safe reference string (PREFIX-YYYYMMDD-NNNNNN) backed by kiraya.reference_seq. Used as a column DEFAULT so tenant-exit reference generation never happens in application code (P5.18).';

alter table kiraya.tenant_exits
    alter column exit_reference set default kiraya.generate_sequential_reference('EXIT');

alter table kiraya.exit_settlements
    alter column settlement_reference set default kiraya.generate_sequential_reference('SET');

alter table kiraya.deposit_refunds
    alter column refund_reference set default kiraya.generate_sequential_reference('REF');

alter table kiraya.tenant_credit_refunds
    alter column refund_reference set default kiraya.generate_sequential_reference('CRF');
