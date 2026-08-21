"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import { parseRecordDepositReceiptFormData, parseRecordDepositDeductionFormData } from "@/lib/validation/securityDeposit";
import { recordDepositReceipt, recordDepositDeduction, createSecurityDepositWithReceipt } from "@/lib/mutations/securityDeposits";

export interface SecurityDepositActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/** securityDepositId is null the first time a receipt is recorded for a tenant with no kiraya.security_deposits row yet — the deposit is created first, then the receipt against it. */
export async function recordDepositReceiptAction(
  securityDepositId: string | null,
  tenantId: string,
  leaseId: string,
  _prevState: SecurityDepositActionState,
  formData: FormData,
): Promise<SecurityDepositActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseRecordDepositReceiptFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  if (!securityDepositId && (!parsed.data.depositReference || parsed.data.requiredAmount === undefined)) {
    return {
      error: "Fix the highlighted fields.",
      fieldErrors: {
        ...(parsed.data.depositReference ? {} : { depositReference: ["Deposit reference is required."] }),
        ...(parsed.data.requiredAmount === undefined ? { requiredAmount: ["Required amount is required."] } : {}),
      },
    };
  }

  const result = securityDepositId
    ? await recordDepositReceipt({
        securityDepositId,
        organizationId: access.organizationId,
        tenantId,
        leaseId,
        amount: parsed.data.amount,
        transactionDate: parsed.data.transactionDate,
        description: parsed.data.description,
        referenceCode: parsed.data.referenceCode,
        createdBy: context.profile.id,
      })
    : await createSecurityDepositWithReceipt({
        securityDepositId: "",
        organizationId: access.organizationId,
        tenantId,
        leaseId,
        amount: parsed.data.amount,
        transactionDate: parsed.data.transactionDate,
        description: parsed.data.description,
        referenceCode: parsed.data.referenceCode,
        createdBy: context.profile.id,
        requiredAmount: parsed.data.requiredAmount ?? 0,
        depositReference: parsed.data.depositReference ?? "",
      });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

export async function recordDepositDeductionAction(
  securityDepositId: string,
  tenantId: string,
  leaseId: string,
  _prevState: SecurityDepositActionState,
  formData: FormData,
): Promise<SecurityDepositActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseRecordDepositDeductionFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await recordDepositDeduction({
    securityDepositId,
    organizationId: access.organizationId,
    tenantId,
    leaseId,
    amount: parsed.data.amount,
    transactionDate: parsed.data.transactionDate,
    description: parsed.data.description,
    createdBy: context.profile.id,
  });
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}
