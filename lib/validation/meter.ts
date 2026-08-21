import { z } from "zod";
import { optionalCoercedNumber, optionalIsoDate, optionalTrimmedString, requiredTrimmedString } from "./shared";
import { UTILITY_CHARGING_METHODS } from "./utility";
import { CONFIGURATION_SCOPES } from "./utilityConfiguration";

export const meterFormSchema = z
  .object({
    utilityId: requiredTrimmedString("Utility"),
    scope: z.enum(CONFIGURATION_SCOPES, { error: "Choose a scope." }),
    propertyId: optionalTrimmedString(),
    unitId: optionalTrimmedString(),
    meterCode: requiredTrimmedString("Meter code", 50),
    meterType: z.enum(UTILITY_CHARGING_METHODS, { error: "Choose a meter type." }),
    serialNumber: optionalTrimmedString(100),
    unitName: optionalTrimmedString(30),
    multiplier: optionalCoercedNumber((schema) => schema.gt(0, { error: "Multiplier must be greater than zero." })),
    installedOn: optionalIsoDate(),
    initialReading: optionalCoercedNumber((schema) => schema.gte(0, { error: "Enter a reading of 0 or more." })),
  })
  .refine((data) => (data.scope === "PROPERTY" ? Boolean(data.propertyId) : Boolean(data.unitId)), {
    error: "Choose the property or unit this meter is installed at.",
    path: ["propertyId"],
  });

export type MeterFormValues = z.infer<typeof meterFormSchema>;

export function parseMeterFormData(formData: FormData) {
  return meterFormSchema.safeParse({
    utilityId: formData.get("utilityId"),
    scope: formData.get("scope"),
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId"),
    meterCode: formData.get("meterCode"),
    meterType: formData.get("meterType"),
    serialNumber: formData.get("serialNumber"),
    unitName: formData.get("unitName"),
    multiplier: formData.get("multiplier"),
    installedOn: formData.get("installedOn"),
    initialReading: formData.get("initialReading"),
  });
}
