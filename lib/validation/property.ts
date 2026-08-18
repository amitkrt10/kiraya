import { z } from "zod";
import {
  countryCodeSchema,
  optionalCoercedNumber,
  optionalTrimmedString,
  requiredTrimmedString,
} from "./shared";

/** Mirrors kiraya.property_status. */
export const PROPERTY_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

/** Field-level constraints mirror supabase/migrations/20260813000110_kiraya_properties.sql exactly. */
export const propertyFormSchema = z.object({
  propertyCode: requiredTrimmedString("Property code"),
  name: requiredTrimmedString("Name"),
  propertyTypeId: optionalTrimmedString(),
  description: optionalTrimmedString(),
  status: z.enum(PROPERTY_STATUSES),
  addressLine1: optionalTrimmedString(),
  addressLine2: optionalTrimmedString(),
  locality: optionalTrimmedString(),
  city: optionalTrimmedString(),
  state: optionalTrimmedString(),
  postalCode: optionalTrimmedString(),
  countryCode: countryCodeSchema,
  latitude: optionalCoercedNumber((s) =>
    s.min(-90, { error: "Latitude must be between -90 and 90." }).max(90, {
      error: "Latitude must be between -90 and 90.",
    }),
  ),
  longitude: optionalCoercedNumber((s) =>
    s.min(-180, { error: "Longitude must be between -180 and 180." }).max(180, {
      error: "Longitude must be between -180 and 180.",
    }),
  ),
  totalArea: optionalCoercedNumber((s) =>
    s.min(0, { error: "Total area cannot be negative." }),
  ),
  areaUnit: optionalTrimmedString(32),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export function parsePropertyFormData(formData: FormData) {
  return propertyFormSchema.safeParse({
    propertyCode: formData.get("propertyCode"),
    name: formData.get("name"),
    propertyTypeId: formData.get("propertyTypeId"),
    description: formData.get("description"),
    status: formData.get("status"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    countryCode: formData.get("countryCode"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    totalArea: formData.get("totalArea"),
    areaUnit: formData.get("areaUnit"),
  });
}
