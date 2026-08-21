import { z } from "zod";
import { optionalTrimmedString, requiredTrimmedString } from "./shared";

/** Mirrors kiraya.meter_type — shared by utility_configurations and meters, matching the codebase-wide "no invented enums" convention. */
export const UTILITY_CHARGING_METHODS = ["FIXED", "SUB_METER", "SELF_METER", "OTHER"] as const;

export const utilityFormSchema = z.object({
  code: requiredTrimmedString("Code", 50),
  name: requiredTrimmedString("Name", 100),
  description: optionalTrimmedString(500),
  unitName: optionalTrimmedString(30),
  isMetered: z.coerce.boolean(),
});

export type UtilityFormValues = z.infer<typeof utilityFormSchema>;

export function parseUtilityFormData(formData: FormData) {
  return utilityFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    unitName: formData.get("unitName"),
    isMetered: formData.get("isMetered") === "on" || formData.get("isMetered") === "true",
  });
}
