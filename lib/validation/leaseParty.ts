import { z } from "zod";
import { optionalTrimmedString } from "./shared";

/** Mirrors kiraya.lease_party_role. */
export const LEASE_PARTY_ROLES = ["CO_TENANT", "OCCUPANT", "GUARANTOR", "OTHER"] as const;

const optionalEmail = () =>
  z.preprocess(
    (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.email({ error: "Enter a valid email address." }).optional(),
  );

/**
 * Mirrors supabase/migrations/20260813000118_kiraya_lease_parties.sql: a
 * party needs either an existing tenant record OR a display name — never
 * neither (matches lease_parties_identity_check).
 */
export const leasePartyFormSchema = z
  .object({
    partyRole: z.enum(LEASE_PARTY_ROLES),
    tenantId: optionalTrimmedString(),
    displayName: optionalTrimmedString(),
    phone: optionalTrimmedString(),
    email: optionalEmail(),
    notes: optionalTrimmedString(),
  })
  .refine((value) => Boolean(value.tenantId) || Boolean(value.displayName), {
    error: "Select an existing tenant or enter a name for this party.",
    path: ["displayName"],
  });

export type LeasePartyFormValues = z.infer<typeof leasePartyFormSchema>;

export function parseLeasePartyFormData(formData: FormData) {
  return leasePartyFormSchema.safeParse({
    partyRole: formData.get("partyRole"),
    tenantId: formData.get("tenantId"),
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
}
