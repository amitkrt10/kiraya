import { z } from "zod";
import { optionalTrimmedString, requiredIsoDate, requiredTrimmedString } from "./shared";

/**
 * Mirrors kiraya.validate_security_deposit_transaction()'s own
 * amount>0 check (via the amount column's CHECK) and required
 * description column. requiredAmount/depositReference are only present
 * (and required) the first time a receipt is recorded for a tenant
 * with no existing kiraya.security_deposits row yet — both are real,
 * required NOT NULL columns on that table, not invented fields; the
 * dialog that uses this schema conditionally shows them.
 */
export const recordDepositReceiptFormSchema = z.object({
  amount: z.coerce.number().gt(0, { error: "Enter an amount greater than zero." }),
  transactionDate: requiredIsoDate("Received date"),
  description: requiredTrimmedString("Description", 500),
  referenceCode: optionalTrimmedString(200),
  requiredAmount: z.coerce.number().gte(0, { error: "Required amount cannot be negative." }).optional(),
  depositReference: optionalTrimmedString(120),
});

export type RecordDepositReceiptFormValues = z.infer<typeof recordDepositReceiptFormSchema>;

export function parseRecordDepositReceiptFormData(formData: FormData) {
  return recordDepositReceiptFormSchema.safeParse({
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    description: formData.get("description"),
    referenceCode: formData.get("referenceCode"),
    requiredAmount: formData.get("requiredAmount") || undefined,
    depositReference: formData.get("depositReference"),
  });
}

/** Mirrors the same amount>0 / required-description shape; the "cannot exceed held" invariant is enforced authoritatively by the database trigger, not duplicated here. */
export const recordDepositDeductionFormSchema = z.object({
  amount: z.coerce.number().gt(0, { error: "Enter an amount greater than zero." }),
  transactionDate: requiredIsoDate("Deduction date"),
  description: requiredTrimmedString("Reason", 500),
});

export type RecordDepositDeductionFormValues = z.infer<typeof recordDepositDeductionFormSchema>;

export function parseRecordDepositDeductionFormData(formData: FormData) {
  return recordDepositDeductionFormSchema.safeParse({
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    description: formData.get("description"),
  });
}
