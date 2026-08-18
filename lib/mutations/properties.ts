import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PropertyFormValues } from "@/lib/validation/property";
import type { PropertyRow } from "@/lib/queries/properties";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Fields a user is allowed to set — id/created_at/updated_at/organization_id are never taken from form input. */
function toPropertyFields(values: PropertyFormValues) {
  return {
    property_type_id: values.propertyTypeId ?? null,
    property_code: values.propertyCode,
    name: values.name,
    description: values.description ?? null,
    status: values.status,
    address_line_1: values.addressLine1 ?? null,
    address_line_2: values.addressLine2 ?? null,
    locality: values.locality ?? null,
    city: values.city ?? null,
    state: values.state ?? null,
    postal_code: values.postalCode ?? null,
    country_code: values.countryCode,
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
    total_area: values.totalArea ?? null,
    area_unit: values.areaUnit ?? null,
  };
}

/** organization_id is derived server-side from the caller's current org context — never from the form. */
export async function createProperty(
  organizationId: string,
  values: PropertyFormValues,
): Promise<MutationResult<PropertyRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({ organization_id: organizationId, ...toPropertyFields(values) })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** organization_id appears only in the WHERE scope, never in the SET clause — it's not editable via this form. */
export async function updateProperty(
  propertyId: string,
  organizationId: string,
  values: PropertyFormValues,
): Promise<MutationResult<PropertyRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .update(toPropertyFields(values))
    .eq("id", propertyId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
