import { z } from "zod";
import { optionalIsoDate, optionalTrimmedString, requiredIsoDate, requiredTrimmedString } from "./shared";

/**
 * Mirrors supabase/migrations/20260813000119_kiraya_lease_rent_rules.sql.
 * `auto_apply` is intentionally not exposed here — the migration's own
 * comment marks it "reserved for future automation" with no billing engine
 * to honor it yet, so the form doesn't offer a toggle that does nothing.
 */
export const rentRuleFormSchema = z
  .object({
    ruleName: requiredTrimmedString("Rule name"),
    monthlyRent: z.coerce.number().min(0, { error: "Monthly rent cannot be negative." }),
    effectiveFrom: requiredIsoDate("Effective from"),
    effectiveTo: optionalIsoDate(),
    notes: optionalTrimmedString(),
  })
  .refine((value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom, {
    error: "End date can't be before the start date.",
    path: ["effectiveTo"],
  });

export type RentRuleFormValues = z.infer<typeof rentRuleFormSchema>;

export function parseRentRuleFormData(formData: FormData) {
  return rentRuleFormSchema.safeParse({
    ruleName: formData.get("ruleName"),
    monthlyRent: formData.get("monthlyRent"),
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
    notes: formData.get("notes"),
  });
}
