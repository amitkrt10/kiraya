"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import {
  parseInitiateTenantExitFormData,
  parseAddSettlementAdjustmentFormData,
  parseCreateDepositRefundFormData,
  parseCreateCreditRefundFormData,
} from "@/lib/validation/tenantExit";
import {
  initiateTenantExit,
  calculateExitSettlement,
  addSettlementAdjustment,
  finalizeExitSettlement,
  createDepositRefund,
  completeDepositRefund,
  createCreditRefund,
  completeCreditRefund,
  confirmActualExitDateIfMissing,
  completeTenantExit,
} from "@/lib/mutations/tenantExits";
import { getExitSettlementById, getDepositRefunds, getTenantCreditRefunds } from "@/lib/queries/tenantExits";
import { getSecurityDepositByLease } from "@/lib/queries/securityDeposits";

export interface TenantExitActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function initiateTenantExitAction(
  leaseId: string,
  tenantId: string,
  _prevState: TenantExitActionState,
  formData: FormData,
): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseInitiateTenantExitFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await initiateTenantExit({
    organizationId: access.organizationId,
    leaseId,
    tenantId,
    noticeDate: parsed.data.noticeDate,
    plannedExitDate: parsed.data.plannedExitDate,
    handoverDate: parsed.data.handoverDate,
    reason: parsed.data.reason,
    initiatedBy: context.profile.id,
  });
  if (!result.data) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  redirect(`/app/exits/${result.data.exit.id}/review`);
}

export async function recalculateExitSettlementAction(exitSettlementId: string, tenantId: string): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const result = await calculateExitSettlement(exitSettlementId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

export async function addSettlementAdjustmentAction(
  exitSettlementId: string,
  tenantId: string,
  _prevState: TenantExitActionState,
  formData: FormData,
): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseAddSettlementAdjustmentFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await addSettlementAdjustment({
    organizationId: access.organizationId,
    exitSettlementId,
    itemType: parsed.data.itemType,
    description: parsed.data.description,
    amount: parsed.data.amount,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

export async function finalizeExitSettlementAction(exitSettlementId: string, tenantId: string): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await finalizeExitSettlement(exitSettlementId, context.profile.id);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

/**
 * Pool B (deposit-origin) only. Amount is never taken from the client —
 * it's derived here from the settlement's own authoritative
 * deposit_origin_refundable (P5.7F — NEVER the combined
 * final_amount_refundable, which can also contain Pool A/credit-origin
 * money) minus whatever has already been recorded (non-CANCELLED/FAILED)
 * against it, the exact remaining capacity kiraya.
 * validate_deposit_refund_cap() enforces (itself now capped against the
 * deposit's live held balance, not a settlement figure). This is a read
 * of already-authoritative numbers, not a financial calculation.
 */
export async function createDepositRefundAction(
  exitSettlementId: string,
  tenantId: string,
  _prevState: TenantExitActionState,
  formData: FormData,
): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseCreateDepositRefundFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const settlement = await getExitSettlementById(exitSettlementId, access.organizationId);
  if (!settlement) {
    return { error: "Exit settlement does not exist." };
  }
  // Defense in depth: tenantId is a bound argument, not re-derived from
  // trusted server state above this line, so it's verified against the
  // org-scoped settlement itself rather than trusted outright — the
  // settlement, not the caller-supplied tenantId, is what determines
  // which lease/deposit/tenant this refund can touch.
  if (settlement.tenant_id !== tenantId) {
    return { error: "Exit settlement does not belong to this tenant." };
  }

  // The deposit is always resolved by settlement.lease_id — the exit's own
  // occupancy, already verified to belong to this organization above —
  // never by the tenantId passed into this action. A tenant can hold
  // multiple leases (one per unit) with independent deposits; resolving
  // by tenant alone could silently refund a different unit's deposit than
  // the one this exit is actually for.
  const [deposit, existingRefunds] = await Promise.all([
    getSecurityDepositByLease(settlement.lease_id, access.organizationId),
    getDepositRefunds(exitSettlementId, access.organizationId),
  ]);

  if (!deposit) {
    return { error: "No security deposit is on file for this lease." };
  }

  const alreadyRecorded = existingRefunds
    .filter((refund) => refund.status !== "CANCELLED" && refund.status !== "FAILED")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const remaining = Math.round((settlement.deposit_origin_refundable - alreadyRecorded) * 100) / 100;

  if (remaining <= 0) {
    return { error: "There is no deposit-origin refundable amount remaining on this settlement." };
  }

  const result = await createDepositRefund({
    organizationId: access.organizationId,
    securityDepositId: deposit.id,
    tenantExitId: settlement.tenant_exit_id,
    exitSettlementId,
    tenantId,
    amount: remaining,
    refundDate: parsed.data.refundDate,
    paymentMethodId: parsed.data.paymentMethodId,
    transactionReference: parsed.data.transactionReference,
    notes: parsed.data.notes,
  });
  if (!result.data) {
    return { error: result.error };
  }

  const completeResult = await completeDepositRefund(result.data.id, parsed.data.refundDate);
  if (completeResult.error) {
    return { error: completeResult.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

/**
 * Pool A (credit-origin) only — mirrors createDepositRefundAction()
 * exactly, scoped to kiraya.exit_settlements.credit_origin_refundable
 * instead. Never creates a deposit_refunds row, never references
 * security_deposit_id, never touches security_deposit_transactions —
 * structurally cannot cross into Pool B (P5.7E-LOCK §7).
 */
export async function createCreditRefundAction(
  exitSettlementId: string,
  tenantId: string,
  _prevState: TenantExitActionState,
  formData: FormData,
): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseCreateCreditRefundFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const [settlement, existingRefunds] = await Promise.all([
    getExitSettlementById(exitSettlementId, access.organizationId),
    getTenantCreditRefunds(exitSettlementId, access.organizationId),
  ]);

  if (!settlement) {
    return { error: "Exit settlement does not exist." };
  }

  const alreadyRecorded = existingRefunds
    .filter((refund) => refund.status !== "CANCELLED" && refund.status !== "FAILED")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const remaining = Math.round((settlement.credit_origin_refundable - alreadyRecorded) * 100) / 100;

  if (remaining <= 0) {
    return { error: "There is no credit-origin refundable amount remaining on this settlement." };
  }

  const result = await createCreditRefund({
    organizationId: access.organizationId,
    tenantExitId: settlement.tenant_exit_id,
    exitSettlementId,
    tenantId,
    amount: remaining,
    currencyCode: settlement.currency_code,
    refundDate: parsed.data.refundDate,
    paymentMethodId: parsed.data.paymentMethodId,
    transactionReference: parsed.data.transactionReference,
    notes: parsed.data.notes,
  });
  if (!result.data) {
    return { error: result.error };
  }

  const completeResult = await completeCreditRefund(result.data.id, parsed.data.refundDate);
  if (completeResult.error) {
    return { error: completeResult.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

export async function completeTenantExitAction(tenantExitId: string, tenantId: string): Promise<TenantExitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const dateResult = await confirmActualExitDateIfMissing(tenantExitId);
  if (!dateResult.data) {
    return { error: dateResult.error };
  }

  const result = await completeTenantExit(tenantExitId, context.profile.id);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  revalidatePath(`/app/exits/${tenantExitId}`);
  return { success: true };
}
