import { z } from "zod";
import {
  countryCodeSchema,
  optionalIsoDate,
  optionalTrimmedString,
  requiredTrimmedString,
} from "./shared";

/** Mirrors kiraya.tenant_type. */
export const TENANT_TYPES = ["INDIVIDUAL", "COMPANY", "OTHER"] as const;

/** Mirrors kiraya.tenant_status. */
export const TENANT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

const optionalEmail = () =>
  z.preprocess(
    (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.email({ error: "Enter a valid email address." }).optional(),
  );

/** Field-level constraints mirror supabase/migrations/20260813000115_kiraya_tenants.sql exactly. */
export const tenantFormSchema = z.object({
  tenantCode: requiredTrimmedString("Tenant code"),
  displayName: requiredTrimmedString("Name"),
  tenantType: z.enum(TENANT_TYPES),
  status: z.enum(TENANT_STATUSES),
  legalName: optionalTrimmedString(),
  phone: optionalTrimmedString(),
  alternatePhone: optionalTrimmedString(),
  email: optionalEmail(),
  taxIdentifier: optionalTrimmedString(),
  dateOfBirth: optionalIsoDate(),
  companyRegistrationNumber: optionalTrimmedString(),
  addressLine1: optionalTrimmedString(),
  addressLine2: optionalTrimmedString(),
  locality: optionalTrimmedString(),
  city: optionalTrimmedString(),
  state: optionalTrimmedString(),
  postalCode: optionalTrimmedString(),
  countryCode: countryCodeSchema,
  emergencyContactName: optionalTrimmedString(),
  emergencyContactPhone: optionalTrimmedString(),
  notes: optionalTrimmedString(),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

export function parseTenantFormData(formData: FormData) {
  return tenantFormSchema.safeParse({
    tenantCode: formData.get("tenantCode"),
    displayName: formData.get("displayName"),
    tenantType: formData.get("tenantType"),
    status: formData.get("status"),
    legalName: formData.get("legalName"),
    phone: formData.get("phone"),
    alternatePhone: formData.get("alternatePhone"),
    email: formData.get("email"),
    taxIdentifier: formData.get("taxIdentifier"),
    dateOfBirth: formData.get("dateOfBirth"),
    companyRegistrationNumber: formData.get("companyRegistrationNumber"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    countryCode: formData.get("countryCode"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    notes: formData.get("notes"),
  });
}
