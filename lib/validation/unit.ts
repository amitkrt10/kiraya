import { z } from "zod";
import { optionalCoercedNumber, optionalTrimmedString, requiredTrimmedString } from "./shared";

/** Mirrors kiraya.unit_status. */
export const UNIT_STATUSES = ["VACANT", "OCCUPIED", "MAINTENANCE", "UNAVAILABLE"] as const;

/** Field-level constraints mirror supabase/migrations/20260813000112_kiraya_units.sql exactly. */
export const unitFormSchema = z.object({
  unitCode: requiredTrimmedString("Unit code"),
  name: optionalTrimmedString(),
  unitTypeId: optionalTrimmedString(),
  description: optionalTrimmedString(),
  status: z.enum(UNIT_STATUSES),
  floorNumber: optionalCoercedNumber((s) => s.int({ error: "Floor number must be a whole number." })),
  area: optionalCoercedNumber((s) => s.min(0, { error: "Area cannot be negative." })),
  areaUnit: optionalTrimmedString(32),
  bedrooms: optionalCoercedNumber((s) => s.min(0, { error: "Bedrooms cannot be negative." })),
  bathrooms: optionalCoercedNumber((s) => s.min(0, { error: "Bathrooms cannot be negative." })),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;

export function parseUnitFormData(formData: FormData) {
  return unitFormSchema.safeParse({
    unitCode: formData.get("unitCode"),
    name: formData.get("name"),
    unitTypeId: formData.get("unitTypeId"),
    description: formData.get("description"),
    status: formData.get("status"),
    floorNumber: formData.get("floorNumber"),
    area: formData.get("area"),
    areaUnit: formData.get("areaUnit"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
  });
}
