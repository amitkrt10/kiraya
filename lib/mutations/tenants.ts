import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TenantFormValues } from "@/lib/validation/tenant";
import type { TenantRow } from "@/lib/queries/tenants";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Fields a user is allowed to set — id/created_at/organization_id are never taken from form input. */
function toTenantFields(values: TenantFormValues) {
  return {
    tenant_code: values.tenantCode,
    display_name: values.displayName,
    tenant_type: values.tenantType,
    status: values.status,
    legal_name: values.legalName ?? null,
    phone: values.phone ?? null,
    alternate_phone: values.alternatePhone ?? null,
    email: values.email ?? null,
    tax_identifier: values.taxIdentifier ?? null,
    date_of_birth: values.dateOfBirth ?? null,
    company_registration_number: values.companyRegistrationNumber ?? null,
    address_line_1: values.addressLine1 ?? null,
    address_line_2: values.addressLine2 ?? null,
    locality: values.locality ?? null,
    city: values.city ?? null,
    state: values.state ?? null,
    postal_code: values.postalCode ?? null,
    country_code: values.countryCode,
    emergency_contact_name: values.emergencyContactName ?? null,
    emergency_contact_phone: values.emergencyContactPhone ?? null,
    notes: values.notes ?? null,
  };
}

/** organization_id is derived server-side from the caller's current org context — never from the form. */
export async function createTenant(
  organizationId: string,
  values: TenantFormValues,
): Promise<MutationResult<TenantRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ organization_id: organizationId, ...toTenantFields(values) })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
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
  return { data };
}
