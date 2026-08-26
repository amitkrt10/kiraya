import { z } from "zod";
import { optionalCoercedNumber, optionalTrimmedString, requiredIsoDate, requiredTrimmedString } from "./shared";
import { BILLING_FREQUENCIES, PRORATION_METHODS } from "./billingConfig";

/**
 * P6.3-C: the Assign Tenant form's full set of fields, validated once
 * client/server before the single kiraya.create_tenant_unit_assignment()
 * RPC call — this schema never duplicates the RPC's own authorization or
 * business-rule checks (org membership, unit assignability, overlapping
 * rent rules, ...); it only rejects obviously-malformed input the same
 * way every other form in this codebase does, matching leaseFormSchema/
 * rentRuleFormSchema/billingConfigFormSchema exactly in spirit.
 *
 * Effective From/To are deliberately absent for the rent rule (mirrors
 * rentRuleFormSchema's own field set minus the dates) — the mutation
 * layer derives effective_from from occupancyStartDate, never exposed
 * here. first_bill_prorate/final_bill_prorate/bill_in_advance are
 * deliberately absent too — P6.2's audit found them stored but inert
 * (never read by any billing function), so this form doesn't offer
 * controls that do nothing.
 */
export const tenantUnitAssignmentFormSchema = z
  .object({
    tenantId: z.string().trim().min(1, { error: "Select a tenant." }),
    occupancyStartDate: requiredIsoDate("Occupancy start date"),
    occupancyNotes: optionalTrimmedString(2000),
    ruleName: requiredTrimmedString("Rule name"),
    monthlyRent: z.coerce.number().min(0, { error: "Monthly rent cannot be negative." }),
    billingFrequency: z.enum(BILLING_FREQUENCIES),
    billingDay: optionalCoercedNumber((s) => s.int().min(1).max(31)),
    prorationMethod: z.enum(PRORATION_METHODS),
    dueDaysAfterBill: z.coerce
      .number()
      .int()
      .min(0, { error: "Must be 0 or more." })
      .max(365, { error: "Must be 365 or fewer." }),
    depositRequiredAmount: optionalCoercedNumber((s) => s.gte(0, { error: "Deposit amount cannot be negative." })),
    depositReference: optionalTrimmedString(120),
    depositNotes: optionalTrimmedString(1000),
  })
  .refine((value) => value.billingFrequency !== "MONTHLY" || value.billingDay !== undefined, {
    error: "Billing day is required for monthly billing.",
    path: ["billingDay"],
  });

export type TenantUnitAssignmentFormValues = z.infer<typeof tenantUnitAssignmentFormSchema>;

export function parseTenantUnitAssignmentFormData(formData: FormData) {
  return tenantUnitAssignmentFormSchema.safeParse({
    tenantId: formData.get("tenantId"),
    occupancyStartDate: formData.get("occupancyStartDate"),
    occupancyNotes: formData.get("occupancyNotes"),
    ruleName: formData.get("ruleName"),
    monthlyRent: formData.get("monthlyRent"),
    billingFrequency: formData.get("billingFrequency"),
    billingDay: formData.get("billingDay"),
    prorationMethod: formData.get("prorationMethod"),
    dueDaysAfterBill: formData.get("dueDaysAfterBill"),
    depositRequiredAmount: formData.get("depositRequiredAmount"),
    depositReference: formData.get("depositReference"),
    depositNotes: formData.get("depositNotes"),
  });
}
