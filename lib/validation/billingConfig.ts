import { z } from "zod";
import { optionalCoercedNumber, optionalIsoDate, optionalTrimmedString, requiredIsoDate } from "./shared";

/** Mirrors kiraya.billing_frequency. */
export const BILLING_FREQUENCIES = ["MONTHLY", "QUARTERLY", "YEARLY", "WEEKLY", "CUSTOM"] as const;

/** Mirrors kiraya.proration_method. */
export const PRORATION_METHODS = ["CALENDAR_DAYS", "FIXED_30_DAYS", "DATE_TO_DATE", "NONE"] as const;

/**
 * An unchecked HTML checkbox is omitted from FormData entirely — there's no
 * way to distinguish "never rendered" from "unchecked," so absence always
 * means false here. The *initial* checked state on new-lease forms (matching
 * the database's own defaults) is a rendering concern (defaultChecked), not
 * a parsing one.
 */
const checkboxBoolean = () => z.preprocess((val) => val === "on" || val === true, z.boolean());

/** Mirrors supabase/migrations/20260813000120_kiraya_lease_billing_configs.sql. */
export const billingConfigFormSchema = z
  .object({
    billingFrequency: z.enum(BILLING_FREQUENCIES),
    billingDay: optionalCoercedNumber((s) => s.int().min(1).max(31)),
    billingAnchorMonth: optionalCoercedNumber((s) => s.int().min(1).max(12)),
    prorationMethod: z.enum(PRORATION_METHODS),
    firstBillProrate: checkboxBoolean(),
    finalBillProrate: checkboxBoolean(),
    billInAdvance: checkboxBoolean(),
    dueDaysAfterBill: z.coerce
      .number()
      .int()
      .min(0, { error: "Must be 0 or more." })
      .max(365, { error: "Must be 365 or fewer." }),
    effectiveFrom: requiredIsoDate("Effective from"),
    effectiveTo: optionalIsoDate(),
    notes: optionalTrimmedString(),
  })
  .refine((value) => value.billingFrequency !== "MONTHLY" || value.billingDay !== undefined, {
    error: "Billing day is required for monthly billing.",
    path: ["billingDay"],
  })
  .refine((value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom, {
    error: "End date can't be before the start date.",
    path: ["effectiveTo"],
  });

export type BillingConfigFormValues = z.infer<typeof billingConfigFormSchema>;

export function parseBillingConfigFormData(formData: FormData) {
  return billingConfigFormSchema.safeParse({
    billingFrequency: formData.get("billingFrequency"),
    billingDay: formData.get("billingDay"),
    billingAnchorMonth: formData.get("billingAnchorMonth"),
    prorationMethod: formData.get("prorationMethod"),
    firstBillProrate: formData.get("firstBillProrate"),
    finalBillProrate: formData.get("finalBillProrate"),
    billInAdvance: formData.get("billInAdvance"),
    dueDaysAfterBill: formData.get("dueDaysAfterBill"),
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
    notes: formData.get("notes"),
  });
}
