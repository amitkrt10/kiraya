import { z } from "zod";
import {
  countryCodeSchema,
  optionalCoercedNumber,
  optionalIsoDate,
  optionalTrimmedString,
  requiredTrimmedString,
} from "./shared";

/** Mirrors kiraya.tenant_type (P6.2-D2 added SCHOOL/INSTITUTE/FAMILY). */
export const TENANT_TYPES = ["INDIVIDUAL", "COMPANY", "OTHER", "SCHOOL", "INSTITUTE", "FAMILY"] as const;

/** Mirrors kiraya.tenant_status. */
export const TENANT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

/**
 * Mirrors kiraya.tenant_religion exactly, in the same fixed order — a
 * plain Postgres enum (P6.2-D2 amendment), not a configuration table.
 * Stable stored codes; display labels live alongside each component's
 * own *_LABELS map, matching how TENANT_TYPES/TENANT_STATUSES are
 * already handled in this codebase.
 */
export const TENANT_RELIGIONS = [
  "HINDU",
  "MUSLIM",
  "CHRISTIAN",
  "SIKH",
  "BUDDHIST",
  "JAIN",
  "PARSI_ZOROASTRIAN",
  "JEWISH",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

const optionalReligion = () =>
  z.preprocess(
    (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.enum(TENANT_RELIGIONS).optional(),
  );

/** The 4 contact slots every tenant form field is one of — mirrors kiraya.tenant_contact_type + sort_order (1 | 2). */
export const CONTACT_FIELD_PREFIXES = [
  "emergencyContact1",
  "emergencyContact2",
  "localReference1",
  "localReference2",
] as const;
export type ContactFieldPrefix = (typeof CONTACT_FIELD_PREFIXES)[number];

const optionalEmail = () =>
  z.preprocess(
    (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.email({ error: "Enter a valid email address." }).optional(),
  );

/**
 * tenantCode is intentionally absent — P6.2-D2 makes it fully automatic
 * (kiraya.generate_tenant_code(), a BEFORE INSERT trigger) and removes it
 * from the create/edit form entirely; the application never supplies it.
 *
 * unit/property/occupancy/rent/billing/deposit fields are deliberately
 * absent too — P6.2-D2 scopes the Tenant record to personal/demographic
 * data only; unit assignment is P6.2-D3, a separate future checkpoint
 * initiated from the Unit page, not from this form.
 *
 * Every emergencyContact/localReference field is a flat top-level key
 * (not a nested object) so z.flattenError()'s fieldErrors map — the same
 * convention every other form in this codebase relies on — keys directly
 * by input name (e.g. "emergencyContact1Name"), matching Input's `name`
 * attribute exactly.
 *
 * Field-level constraints otherwise mirror supabase/migrations/
 * 20260813000115_kiraya_tenants.sql and the P6.2-D2 additions
 * (20260826161000_kiraya_tenant_profile_fields.sql,
 * 20260826162000_kiraya_tenant_contacts.sql) exactly.
 */
export const tenantFormSchema = z.object({
  displayName: requiredTrimmedString("Name"),
  dateOfBirth: optionalIsoDate(),
  religion: optionalReligion(),
  memberCount: optionalCoercedNumber((schema) =>
    schema.int({ error: "No. of Members must be a whole number." }).min(1, { error: "No. of Members must be at least 1." }),
  ),
  tenantType: z.enum(TENANT_TYPES),
  status: z.enum(TENANT_STATUSES),
  legalName: optionalTrimmedString(),
  phone: optionalTrimmedString(),
  alternatePhone: optionalTrimmedString(),
  email: optionalEmail(),
  aadhaarNumber: optionalTrimmedString(),
  panNumber: optionalTrimmedString(),
  otherIdentityDocumentNumber: optionalTrimmedString(),
  companyRegistrationNumber: optionalTrimmedString(),
  addressLine1: optionalTrimmedString(),
  addressLine2: optionalTrimmedString(),
  locality: optionalTrimmedString(),
  city: optionalTrimmedString(),
  state: optionalTrimmedString(),
  postalCode: optionalTrimmedString(),
  countryCode: countryCodeSchema,
  emergencyContact1Name: optionalTrimmedString(),
  emergencyContact1Phone: optionalTrimmedString(),
  emergencyContact1Address: optionalTrimmedString(),
  emergencyContact2Name: optionalTrimmedString(),
  emergencyContact2Phone: optionalTrimmedString(),
  emergencyContact2Address: optionalTrimmedString(),
  localReference1Name: optionalTrimmedString(),
  localReference1Phone: optionalTrimmedString(),
  localReference1Address: optionalTrimmedString(),
  localReference2Name: optionalTrimmedString(),
  localReference2Phone: optionalTrimmedString(),
  localReference2Address: optionalTrimmedString(),
  notes: optionalTrimmedString(),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

export function parseTenantFormData(formData: FormData) {
  return tenantFormSchema.safeParse({
    displayName: formData.get("displayName"),
    dateOfBirth: formData.get("dateOfBirth"),
    religion: formData.get("religion"),
    memberCount: formData.get("memberCount"),
    tenantType: formData.get("tenantType"),
    status: formData.get("status"),
    legalName: formData.get("legalName"),
    phone: formData.get("phone"),
    alternatePhone: formData.get("alternatePhone"),
    email: formData.get("email"),
    aadhaarNumber: formData.get("aadhaarNumber"),
    panNumber: formData.get("panNumber"),
    otherIdentityDocumentNumber: formData.get("otherIdentityDocumentNumber"),
    companyRegistrationNumber: formData.get("companyRegistrationNumber"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    countryCode: formData.get("countryCode"),
    emergencyContact1Name: formData.get("emergencyContact1Name"),
    emergencyContact1Phone: formData.get("emergencyContact1Phone"),
    emergencyContact1Address: formData.get("emergencyContact1Address"),
    emergencyContact2Name: formData.get("emergencyContact2Name"),
    emergencyContact2Phone: formData.get("emergencyContact2Phone"),
    emergencyContact2Address: formData.get("emergencyContact2Address"),
    localReference1Name: formData.get("localReference1Name"),
    localReference1Phone: formData.get("localReference1Phone"),
    localReference1Address: formData.get("localReference1Address"),
    localReference2Name: formData.get("localReference2Name"),
    localReference2Phone: formData.get("localReference2Phone"),
    localReference2Address: formData.get("localReference2Address"),
    notes: formData.get("notes"),
  });
}
