-- P5.7F Migration A — schema primitives for deposit/credit separation (Model C2, locked in P5.7E).
--
-- Adds the granular columns/links/enum values the corrected accounting model needs.
-- No behavior changes here — calculate_exit_settlement()/finalize_exit_settlement()/
-- post_exit_settlement_to_ledger() are rewritten in a later migration (C) so this
-- migration is purely additive and safe to apply on its own.

-- exit_settlements: previous_dues/final_charges/tenant_credit/final_amount_due/
-- final_amount_refundable already exist and remain the authoritative columns (their
-- *meaning* changes in migration C, not their names, to avoid two competing truths).
-- The four new columns below give the origin-tagged breakdown P5.7D/E require.
alter table kiraya.exit_settlements
  add column if not exists credit_applied numeric(18,2) not null default 0,
  add column if not exists deposit_consumed numeric(18,2) not null default 0,
  add column if not exists deposit_origin_refundable numeric(18,2) not null default 0,
  add column if not exists credit_origin_refundable numeric(18,2) not null default 0;

comment on column kiraya.exit_settlements.tenant_credit is
  'As of P5.7F: available_credit = greatest(0, -get_tenant_balance()) at calculation time. '
  'No longer get_tenant_credit() (the narrower, allocation-based figure) — see P5.7C/P5.7E.';
comment on column kiraya.exit_settlements.credit_applied is
  'P5.7F: least(available_credit, final_charges) — how much of the tenant''s existing ledger '
  'credit was used to offset the NEW exit charges specifically (Model C2 — never previous_dues).';
comment on column kiraya.exit_settlements.deposit_consumed is
  'P5.7F: least(final_charges - credit_applied, security deposit held) at finalization time. '
  'The authoritative deposit-consumption figure — replaces the dead exit_settlement_items.'
  'DEPOSIT_DEDUCTION path (P5.7D), and is mirrored 1:1 into a real security_deposit_transactions '
  'DEDUCTION row plus a DEPOSIT_APPLICATION ledger entry, never a bare number.';
comment on column kiraya.exit_settlements.final_amount_due is
  'P5.7F: previous_dues + (final_charges - credit_applied - deposit_consumed) — always >= 0. '
  'Deposit and credit only ever offset final_charges, never previous_dues (Model C2).';
comment on column kiraya.exit_settlements.deposit_origin_refundable is
  'P5.7F: security deposit held minus deposit_consumed. Paid ONLY via deposit_refunds / '
  'security_deposit_transactions.REFUND — never conflated with credit_origin_refundable.';
comment on column kiraya.exit_settlements.credit_origin_refundable is
  'P5.7F: available_credit minus credit_applied. Paid ONLY via the new tenant_credit_refunds '
  'mechanism — must never be processed as a security deposit refund.';
comment on column kiraya.exit_settlements.final_amount_refundable is
  'P5.7F: deposit_origin_refundable + credit_origin_refundable, kept for backward-compatible '
  'display only. deposit_origin_refundable/credit_origin_refundable are authoritative for '
  'refund processing — this column must never be used to cap or route an actual refund.';
comment on column kiraya.exit_settlements.deposit_deduction is
  'Deprecated as of P5.7F (superseded by deposit_consumed). Retained only because the '
  '(now-blocked, P5.7F migration B) exit_settlement_items.DEPOSIT_DEDUCTION path historically '
  'fed it; always 0 going forward since that item type can no longer be created.';

-- security_deposit_transactions: link a settlement-linked DEDUCTION back to the exit
-- settlement it was consumed for. NULL for ordinary, exit-independent mid-tenancy deductions.
alter table kiraya.security_deposit_transactions
  add column if not exists exit_settlement_id uuid null references kiraya.exit_settlements(id);

comment on column kiraya.security_deposit_transactions.exit_settlement_id is
  'P5.7F: set only for a DEDUCTION created by exit-settlement finalization (kiraya.'
  'finalize_exit_settlement()). NULL for ordinary mid-tenancy deductions and for RECEIPT/REFUND rows.';

create index if not exists security_deposit_transactions_exit_settlement_idx
  on kiraya.security_deposit_transactions (exit_settlement_id)
  where exit_settlement_id is not null;

-- ledger_entries: two new entry types, and the FK columns to trace them precisely.
alter type kiraya.ledger_entry_type add value if not exists 'DEPOSIT_APPLICATION';
alter type kiraya.ledger_entry_type add value if not exists 'CREDIT_REFUND';

alter table kiraya.ledger_entries
  add column if not exists security_deposit_transaction_id uuid null references kiraya.security_deposit_transactions(id),
  add column if not exists credit_refund_id uuid null;

comment on column kiraya.ledger_entries.security_deposit_transaction_id is
  'P5.7F: set on a DEPOSIT_APPLICATION entry, pointing at the real security_deposit_transactions.'
  'DEDUCTION row it mirrors 1:1. NULL for every other entry_type.';
comment on column kiraya.ledger_entries.credit_refund_id is
  'P5.7F: set on a CREDIT_REFUND entry, pointing at the tenant_credit_refunds row it was posted '
  'for. NULL for every other entry_type. FK added once kiraya.tenant_credit_refunds exists, below.';

create index if not exists ledger_entries_security_deposit_transaction_idx
  on kiraya.ledger_entries (security_deposit_transaction_id)
  where security_deposit_transaction_id is not null;

-- New table: the credit-origin refund record. Deliberately mirrors kiraya.deposit_refunds'
-- shape (P5.7E §7/§11) MINUS security_deposit_id — a credit-origin refund must be
-- structurally incapable of being routed through the deposit mechanism.
create table if not exists kiraya.tenant_credit_refunds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references kiraya.organizations(id),
  tenant_exit_id uuid not null references kiraya.tenant_exits(id),
  exit_settlement_id uuid not null references kiraya.exit_settlements(id),
  tenant_id uuid not null references kiraya.tenants(id),
  refund_reference text not null,
  refund_date date,
  amount numeric(18,2) not null,
  currency_code text not null,
  payment_method_id uuid null references kiraya.payment_methods(id),
  status text not null default 'PENDING',
  transaction_reference text null,
  processed_by uuid null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_credit_refunds_status_check
    check (status in ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED')),
  constraint tenant_credit_refunds_amount_check
    check (amount > 0)
);

comment on table kiraya.tenant_credit_refunds is
  'P5.7F: Pool A (credit-origin) refund records, deliberately separate from kiraya.deposit_refunds. '
  'Has no security_deposit_id — structurally cannot be mistaken for, or processed as, a security '
  'deposit refund. Capped against exit_settlements.credit_origin_refundable, never against '
  'deposit-related figures.';

alter table kiraya.ledger_entries
  add constraint ledger_entries_credit_refund_id_fkey
    foreign key (credit_refund_id) references kiraya.tenant_credit_refunds(id);

create index if not exists ledger_entries_credit_refund_idx
  on kiraya.ledger_entries (credit_refund_id)
  where credit_refund_id is not null;

create unique index if not exists tenant_credit_refunds_org_reference_unique_idx
  on kiraya.tenant_credit_refunds (organization_id, lower(trim(refund_reference)));

create index if not exists tenant_credit_refunds_organization_idx
  on kiraya.tenant_credit_refunds (organization_id);

create index if not exists tenant_credit_refunds_tenant_idx
  on kiraya.tenant_credit_refunds (tenant_id);

create index if not exists tenant_credit_refunds_exit_settlement_idx
  on kiraya.tenant_credit_refunds (exit_settlement_id);

create index if not exists tenant_credit_refunds_status_idx
  on kiraya.tenant_credit_refunds (organization_id, status);

create trigger trg_tenant_credit_refunds_updated_at
  before update on kiraya.tenant_credit_refunds
  for each row execute function kiraya.set_updated_at();

-- RLS: identical shape to kiraya.deposit_refunds (P5.7D confirmed this template is already
-- fully reusable, unchanged) — select via can_access_tenant(), insert/update via
-- can_write_organization(). No delete policy: a credit refund is never hard-deleted,
-- only ever cancelled by updating its status, exactly matching every other financial
-- transaction table in this schema.
alter table kiraya.tenant_credit_refunds enable row level security;

create policy tenant_credit_refunds_select on kiraya.tenant_credit_refunds
  for select
  using (kiraya.can_access_tenant(organization_id, tenant_id));

create policy tenant_credit_refunds_insert on kiraya.tenant_credit_refunds
  for insert
  with check (kiraya.can_write_organization(organization_id));

create policy tenant_credit_refunds_update on kiraya.tenant_credit_refunds
  for update
  using (kiraya.can_write_organization(organization_id))
  with check (kiraya.can_write_organization(organization_id));
