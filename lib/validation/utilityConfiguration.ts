import { z } from "zod";
import { optionalIsoDate, requiredIsoDate } from "./shared";
import { UTILITY_CHARGING_METHODS } from "./utility";

/** Mirrors utility_configurations_scope_check: property_id IS NOT NULL OR unit_id IS NOT NULL. */
export const CONFIGURATION_SCOPES = ["PROPERTY", "UNIT"] as const;

export const utilityConfigurationFormSchema = z
  .object({
    scope: z.enum(CONFIGURATION_SCOPES, { error: "Choose a scope." }),
    propertyId: z.string().trim().min(1).optional(),
    unitId: z.string().trim().min(1).optional(),
    meterType: z.enum(UTILITY_CHARGING_METHODS, { error: "Choose a charging method." }),
    fixedAmount: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce.number().gte(0, { error: "Enter an amount of 0 or more." }).optional(),
    ),
    effectiveFrom: requiredIsoDate("Effective from"),
    effectiveTo: optionalIsoDate(),
    isTenantChargeable: z.coerce.boolean(),
    isActive: z.coerce.boolean(),
  })
  .refine((data) => (data.scope === "PROPERTY" ? Boolean(data.propertyId) : Boolean(data.unitId)), {
    error: "Choose the property or unit this configuration applies to.",
    path: ["propertyId"],
  })
  .refine((data) => (data.meterType !== "FIXED" ? true : data.fixedAmount !== undefined), {
    error: "Enter the fixed amount for a FIXED charging method.",
    path: ["fixedAmount"],
  })
  .refine((data) => (data.effectiveTo ? data.effectiveTo >= data.effectiveFrom : true), {
    error: "Effective to cannot be before effective from.",
    path: ["effectiveTo"],
  });

export type UtilityConfigurationFormValues = z.infer<typeof utilityConfigurationFormSchema>;

export function parseUtilityConfigurationFormData(formData: FormData) {
  return utilityConfigurationFormSchema.safeParse({
    scope: formData.get("scope"),
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId"),
    meterType: formData.get("meterType"),
    fixedAmount: formData.get("fixedAmount"),
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
    isTenantChargeable: formData.get("isTenantChargeable") === "on" || formData.get("isTenantChargeable") === "true",
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
}
