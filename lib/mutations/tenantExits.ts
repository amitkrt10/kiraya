import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  TenantExitRow,
  ExitSettlementRow,
  ExitSettlementItemRow,
  DepositRefundRow,
  TenantCreditRefundRow,
} from "@/lib/queries/tenantExits";
import { translateDatabaseError, type MutationResult } from "./errors";

interface InitiateTenantExitArgs {
  organizationId: string;
  leaseId: string;
  tenantId: string;
  noticeDate?: string;
  plannedExitDate?: string;
  handoverDate?: string;
  reason?: string;
  initiatedBy: string;
}

/**
 * Creates the tenant_exits row, then immediately its exit_settlements row
 * (DRAFT) so every later step has a settlement to calculate/finalize
 * against — kiraya.tenant_exits has no creation RPC (direct INSERT is the
 * only path, confirmed in P5.4D's inspection, matching the established
 * security_deposits precedent), and kiraya.calculate_exit_settlement()
 * requires an existing exit_settlements row before it can run at all.
 * Not wrapped in a database transaction (no RPC bundles this): if the
 * settlement insert fails, the tenant_exit still exists as a valid
 * INITIATED record with no settlement yet — the same non-rollback
 * reasoning already established for lease creation (P5.2C) and deposit
 * receipt creation (P5.4C).
 *
 * exit_reference/settlement_reference are never supplied here — P5.18
 * moved their generation into a database column DEFAULT
 * (kiraya.generate_sequential_reference(), sequence-backed) precisely
 * so concurrent exits for the same organization can never collide;
 * the previous app-side generateReference() had only second
 * granularity and was not safe under real concurrency.
 */
export async function initiateTenantExit(
  args: InitiateTenantExitArgs,
): Promise<MutationResult<{ exit: TenantExitRow; settlement: ExitSettlementRow }>> {
  const supabase = await createClient();

  const { data: exit, error: exitError } = await supabase
    .from("tenant_exits")
    .insert({
      organization_id: args.organizationId,
      lease_id: args.leaseId,
      tenant_id: args.tenantId,
      status: "INITIATED",
      notice_date: args.noticeDate ?? null,
      planned_exit_date: args.plannedExitDate ?? null,
      handover_date: args.handoverDate ?? null,
      reason: args.reason ?? null,
      initiated_by: args.initiatedBy,
    })
    .select("*")
    .single();

  if (exitError) {
    return { error: translateDatabaseError(exitError) };
  }

  const { data: settlement, error: settlementError } = await supabase
    .from("exit_settlements")
    .insert({
      organization_id: args.organizationId,
      tenant_exit_id: exit.id,
      lease_id: args.leaseId,
      tenant_id: args.tenantId,
      settlement_date: new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (settlementError) {
    return { error: translateDatabaseError(settlementError) };
  }

  return { data: { exit, settlement } };
}

/** kiraya.calculate_exit_settlement() — recomputes and returns the settlement's authoritative columns. Only succeeds while DRAFT. */
export async function calculateExitSettlement(exitSettlementId: string): Promise<MutationResult<ExitSettlementRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calculate_exit_settlement", { p_exit_settlement_id: exitSettlementId }).single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: data as ExitSettlementRow };
}

interface AddSettlementAdjustmentArgs {
  organizationId: string;
  exitSettlementId: string;
  itemType: string;
  description: string;
  amount: number;
}

/**
 * Direct INSERT into exit_settlement_items (no creation RPC exists,
 * confirmed in P5.4D's inspection). is_credit is always false — this
 * mutation has no parameter for it, matching the approved charge-only
 * scope; kiraya.prevent_finalized_exit_settlement_item_mutation() blocks
 * this once the parent settlement is FINALIZED, so it's only ever called
 * while the settlement is still DRAFT.
 */
export async function addSettlementAdjustment(args: AddSettlementAdjustmentArgs): Promise<MutationResult<ExitSettlementItemRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exit_settlement_items")
    .insert({
      organization_id: args.organizationId,
      exit_settlement_id: args.exitSettlementId,
      item_type: args.itemType,
      description: args.description,
      amount: args.amount,
      is_credit: false,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** kiraya.finalize_exit_settlement() — recalculates once more, transitions DRAFT -> FINALIZED, and marks the tenant_exit PENDING_SETTLEMENT. */
export async function finalizeExitSettlement(exitSettlementId: string, finalizedBy: string): Promise<MutationResult<ExitSettlementRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("finalize_exit_settlement", { p_exit_settlement_id: exitSettlementId, p_finalized_by: finalizedBy })
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: data as ExitSettlementRow };
}

interface CreateDepositRefundArgs {
  organizationId: string;
  securityDepositId: string;
  tenantExitId: string;
  exitSettlementId: string;
  tenantId: string;
  amount: number;
  refundDate?: string;
  paymentMethodId?: string;
  transactionReference?: string;
  notes?: string;
}

/**
 * Direct INSERT into deposit_refunds (no creation RPC exists, confirmed in
 * P5.4D's inspection). `amount` is supplied by the caller but the caller
 * (the action layer) always derives it from the settlement's own
 * final_amount_refundable minus already-recorded refunds — this function
 * never computes that itself, and kiraya.validate_deposit_refund_cap()
 * is the actual enforcement regardless of what's passed.
 */
export async function createDepositRefund(args: CreateDepositRefundArgs): Promise<MutationResult<DepositRefundRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deposit_refunds")
    .insert({
      organization_id: args.organizationId,
      security_deposit_id: args.securityDepositId,
      tenant_exit_id: args.tenantExitId,
      exit_settlement_id: args.exitSettlementId,
      tenant_id: args.tenantId,
      amount: args.amount,
      refund_date: args.refundDate ?? null,
      payment_method_id: args.paymentMethodId ?? null,
      transaction_reference: args.transactionReference ?? null,
      notes: args.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Transitions a deposit_refunds row to COMPLETED via direct UPDATE — the
 * established legitimate path (P5.4B/P5.4D): kiraya.
 * process_completed_deposit_refund() is an AFTER UPDATE trigger reacting
 * to this exact transition, posting the REFUND security_deposit_transaction
 * itself. This function never inserts into security_deposit_transactions
 * directly.
 */
export async function completeDepositRefund(depositRefundId: string, refundDate?: string): Promise<MutationResult<DepositRefundRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deposit_refunds")
    .update({ status: "COMPLETED", refund_date: refundDate ?? new Date().toISOString().slice(0, 10) })
    .eq("id", depositRefundId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

interface CreateCreditRefundArgs {
  organizationId: string;
  tenantExitId: string;
  exitSettlementId: string;
  tenantId: string;
  amount: number;
  currencyCode: string;
  refundDate?: string;
  paymentMethodId?: string;
  transactionReference?: string;
  notes?: string;
}

/**
 * Direct INSERT into tenant_credit_refunds (P5.7F/G, Pool A) — mirrors
 * createDepositRefund() exactly, minus any security_deposit_id field
 * (there is none on this table, deliberately — P5.7E-LOCK §7). `amount`
 * is supplied by the caller but the action layer always derives it from
 * the settlement's own credit_origin_refundable minus already-recorded
 * credit refunds; kiraya.validate_credit_refund_cap() is the actual
 * enforcement regardless of what's passed.
 */
export async function createCreditRefund(args: CreateCreditRefundArgs): Promise<MutationResult<TenantCreditRefundRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_credit_refunds")
    .insert({
      organization_id: args.organizationId,
      tenant_exit_id: args.tenantExitId,
      exit_settlement_id: args.exitSettlementId,
      tenant_id: args.tenantId,
      amount: args.amount,
      currency_code: args.currencyCode,
      refund_date: args.refundDate ?? null,
      payment_method_id: args.paymentMethodId ?? null,
      transaction_reference: args.transactionReference ?? null,
      notes: args.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Transitions a tenant_credit_refunds row to COMPLETED via direct UPDATE
 * — mirrors completeDepositRefund() exactly. kiraya.
 * process_completed_credit_refund() is an AFTER UPDATE trigger reacting
 * to this exact transition, posting the CREDIT_REFUND ledger entry
 * itself (never security_deposit_transactions — Pool A never touches
 * the deposit subledger).
 */
export async function completeCreditRefund(creditRefundId: string, refundDate?: string): Promise<MutationResult<TenantCreditRefundRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_credit_refunds")
    .update({ status: "COMPLETED", refund_date: refundDate ?? new Date().toISOString().slice(0, 10) })
    .eq("id", creditRefundId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Sets tenant_exits.actual_exit_date via direct UPDATE if it isn't already
 * set — no RPC exists for this (direct client UPDATE is RLS-permitted,
 * can_write_organization()-gated), and kiraya.complete_tenant_exit()
 * reads whatever value is already on the row rather than accepting one as
 * a parameter, so it must be confirmed beforehand. Defaults to the exit's
 * own planned_exit_date when one was given at initiation, falling back to
 * today only if no plan exists at all — never invented, always a real
 * date the exit itself already carries or the moment of completion.
 * kiraya.prevent_completed_tenant_exit_mutation() does not block this: it
 * only fires when new.status = 'COMPLETED', which this update never sets.
 */
export async function confirmActualExitDateIfMissing(tenantExitId: string): Promise<MutationResult<TenantExitRow>> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("tenant_exits")
    .select("*")
    .eq("id", tenantExitId)
    .single();

  if (fetchError) {
    return { error: translateDatabaseError(fetchError) };
  }

  if (existing.actual_exit_date) {
    return { data: existing };
  }

  const { data, error } = await supabase
    .from("tenant_exits")
    .update({ actual_exit_date: existing.planned_exit_date ?? new Date().toISOString().slice(0, 10) })
    .eq("id", tenantExitId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** kiraya.complete_tenant_exit() — atomically completes the exit, ends the lease, and conditionally frees the unit. */
export async function completeTenantExit(tenantExitId: string, completedBy: string): Promise<MutationResult<TenantExitRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("complete_tenant_exit", { p_tenant_exit_id: tenantExitId, p_completed_by: completedBy })
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: data as TenantExitRow };
}
