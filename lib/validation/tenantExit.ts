import { z } from "zod";
import { optionalIsoDate, optionalTrimmedString, requiredTrimmedString } from "./shared";

/** Mirrors kiraya.exit_status — used by the Tenant Exits list filter, matching LEASE_STATUSES/PAYMENT_STATUSES convention. */
export const EXIT_STATUSES = ["INITIATED", "PENDING_SETTLEMENT", "COMPLETED", "CANCELLED"] as const;

/**
 * Mirrors kiraya.tenant_exits' own optional date columns (notice_date,
 * planned_exit_date, handover_date are all nullable) and the reason/notes
 * free-text columns. exit_reference/status/initiated_by are never form
 * fields — the mutation generates the reference and sets status/
 * initiated_by itself, matching the schema's own defaults.
 */
export const initiateTenantExitFormSchema = z.object({
  noticeDate: optionalIsoDate(),
  plannedExitDate: optionalIsoDate(),
  handoverDate: optionalIsoDate(),
  reason: optionalTrimmedString(500),
});

export type InitiateTenantExitFormValues = z.infer<typeof initiateTenantExitFormSchema>;

export function parseInitiateTenantExitFormData(formData: FormData) {
  return initiateTenantExitFormSchema.safeParse({
    noticeDate: formData.get("noticeDate"),
    plannedExitDate: formData.get("plannedExitDate"),
    handoverDate: formData.get("handoverDate"),
    reason: formData.get("reason"),
  });
}

/**
 * Charge-only exit_settlement_items — is_credit is never a form field, the
 * mutation always inserts is_credit=false. item_type is restricted to real
 * charge categories from the schema's own example list (bootstrap comment);
 * PREVIOUS_DUE and DEPOSIT_DEDUCTION are reserved item_types the wizard
 * does not let staff create directly (PREVIOUS_DUE is derived from
 * get_tenant_due(), DEPOSIT_DEDUCTION creation is out of scope this round).
 */
export const SETTLEMENT_ADJUSTMENT_TYPES = ["FINAL_RENT", "ELECTRICITY", "WATER", "MAINTENANCE", "DAMAGE", "CLEANING", "OTHER"] as const;
export type SettlementAdjustmentType = (typeof SETTLEMENT_ADJUSTMENT_TYPES)[number];

export const addSettlementAdjustmentFormSchema = z.object({
  itemType: z.enum(SETTLEMENT_ADJUSTMENT_TYPES, { error: "Select a charge type." }),
  description: requiredTrimmedString("Description", 500),
  amount: z.coerce.number().gt(0, { error: "Enter an amount greater than zero." }),
});

export type AddSettlementAdjustmentFormValues = z.infer<typeof addSettlementAdjustmentFormSchema>;

export function parseAddSettlementAdjustmentFormData(formData: FormData) {
  return addSettlementAdjustmentFormSchema.safeParse({
    itemType: formData.get("itemType"),
    description: formData.get("description"),
    amount: formData.get("amount"),
  });
}

/**
 * deposit_refunds creation — amount is never a form field. The mutation
 * always sets it from the settlement's own final_amount_refundable (minus
 * any already-recorded refunds for that settlement), matching
 * kiraya.validate_deposit_refund_cap()'s cumulative cap. payment_method_id
 * is a real nullable FK column; refund_date/transaction_reference/notes
 * mirror the table directly.
 */
export const createDepositRefundFormSchema = z.object({
  refundDate: optionalIsoDate(),
  paymentMethodId: optionalTrimmedString(),
  transactionReference: optionalTrimmedString(200),
  notes: optionalTrimmedString(1000),
});

export type CreateDepositRefundFormValues = z.infer<typeof createDepositRefundFormSchema>;

export function parseCreateDepositRefundFormData(formData: FormData) {
  return createDepositRefundFormSchema.safeParse({
    refundDate: formData.get("refundDate"),
    paymentMethodId: formData.get("paymentMethodId"),
    transactionReference: formData.get("transactionReference"),
    notes: formData.get("notes"),
  });
}
