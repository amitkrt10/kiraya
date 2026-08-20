import { z } from "zod";
import { optionalIsoDate, optionalTrimmedString, requiredIsoDate } from "./shared";

/**
 * Mirrors the parameters of kiraya.generate_billing_run() and the check
 * constraints on kiraya.billing_runs (20260813000127_kiraya_billing_runs.sql):
 * period_end >= period_start, due_date >= bill_date when supplied. This is a
 * client/server UX pre-check only — the RPC's own checks remain authoritative.
 */
export const billingRunFormSchema = z
  .object({
    periodStart: requiredIsoDate("Period start"),
    periodEnd: requiredIsoDate("Period end"),
    billDate: requiredIsoDate("Bill date"),
    dueDate: optionalIsoDate(),
    propertyId: optionalTrimmedString(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    error: "Period end can't be before period start.",
    path: ["periodEnd"],
  })
  .refine((value) => !value.dueDate || value.dueDate >= value.billDate, {
    error: "Due date can't be before the bill date.",
    path: ["dueDate"],
  });

export type BillingRunFormValues = z.infer<typeof billingRunFormSchema>;

export function parseBillingRunFormData(formData: FormData) {
  return billingRunFormSchema.safeParse({
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    billDate: formData.get("billDate"),
    dueDate: formData.get("dueDate"),
    propertyId: formData.get("propertyId"),
  });
}
