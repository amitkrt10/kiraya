import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TenantFormValues } from "@/lib/validation/tenant";
import type { TenantRow } from "@/lib/queries/tenants";
import { upsertTenantContacts } from "./tenantContacts";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Fields a user is allowed to set — id/created_at/organization_id are
 * never taken from form input. tenant_code is also never taken from
 * form input (P6.2-D2): it isn't in TenantFormValues at all, so
 * kiraya.generate_tenant_code() (a BEFORE INSERT trigger) always fills
 * it in. tax_identifier/emergency_contact_name/emergency_contact_phone
 * are P6.2-D2's deprecated columns — deliberately never written here
 * anymore (superseded by aadhaar_number/pan_number/
 * other_identity_document_number and kiraya.tenant_contacts), but left
 * in the schema untouched (Phase A) so no historical value is lost.
 */
function toTenantFields(values: TenantFormValues) {
  return {
    display_name: values.displayName,
    tenant_type: values.tenantType,
    status: values.status,
    legal_name: values.legalName ?? null,
    phone: values.phone ?? null,
    alternate_phone: values.alternatePhone ?? null,
    email: values.email ?? null,
    date_of_birth: values.dateOfBirth ?? null,
    religion: values.religion ?? null,
    member_count: values.memberCount ?? null,
    aadhaar_number: values.aadhaarNumber ?? null,
    pan_number: values.panNumber ?? null,
    other_identity_document_number: values.otherIdentityDocumentNumber ?? null,
    company_registration_number: values.companyRegistrationNumber ?? null,
    address_line_1: values.addressLine1 ?? null,
    address_line_2: values.addressLine2 ?? null,
    locality: values.locality ?? null,
    city: values.city ?? null,
    state: values.state ?? null,
    postal_code: values.postalCode ?? null,
    country_code: values.countryCode,
    notes: values.notes ?? null,
  };
}

/**
 * organization_id is derived server-side from the caller's current org
 * context — never from the form. Not wrapped in a database transaction
 * (no RPC bundles this): if the contacts upsert fails after the tenant
 * itself was created, the tenant record still exists as a valid row the
 * user can immediately edit to retry the contacts — the same
 * non-rollback reasoning already established for lease creation (P5.2C)
 * and deposit receipt creation (P5.4C).
 */
export async function createTenant(
  organizationId: string,
  values: TenantFormValues,
): Promise<MutationResult<TenantRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    // tenant_code has no column-level DEFAULT (kiraya.generate_tenant_code()
    // is a BEFORE INSERT trigger, not a DEFAULT expression — it needs
    // NEW.organization_id, which a DEFAULT expression can't see). The empty
    // string here is never actually stored: the trigger treats a null/blank
    // tenant_code as "not provided" and always overwrites it before the row
    // is written. This satisfies the generated Insert type's requiredness
    // (there's no DEFAULT for Supabase's type generator to see either)
    // without the application ever supplying a real value.
    .insert({ organization_id: organizationId, tenant_code: "", ...toTenantFields(values) })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }

  const contactsResult = await upsertTenantContacts(data.id, organizationId, values);
  if (contactsResult.error) {
    return { error: contactsResult.error };
  }

  return { data };
}

/** organization_id appears only in the WHERE scope, never in the SET clause. */
export async function updateTenant(
  tenantId: string,
  organizationId: string,
  values: TenantFormValues,
): Promise<MutationResult<TenantRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(toTenantFields(values))
    .eq("id", tenantId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }

  const contactsResult = await upsertTenantContacts(tenantId, organizationId, values);
  if (contactsResult.error) {
    return { error: contactsResult.error };
  }

  return { data };
}
