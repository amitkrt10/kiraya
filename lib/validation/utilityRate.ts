import { z } from "zod";
import { optionalIsoDate, requiredIsoDate, requiredTrimmedString } from "./shared";

export const utilityRateFormSchema = z
  .object({
    rate: z.coerce.number().gt(0, { error: "Enter a rate greater than zero." }),
    unitName: requiredTrimmedString("Unit", 30),
    effectiveFrom: requiredIsoDate("Effective from"),
    effectiveTo: optionalIsoDate(),
  })
  .refine((data) => (data.effectiveTo ? data.effectiveTo >= data.effectiveFrom : true), {
    error: "Effective to cannot be before effective from.",
    path: ["effectiveTo"],
  });

export type UtilityRateFormValues = z.infer<typeof utilityRateFormSchema>;

export function parseUtilityRateFormData(formData: FormData) {
  return utilityRateFormSchema.safeParse({
    rate: formData.get("rate"),
    unitName: formData.get("unitName"),
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
  });
}
