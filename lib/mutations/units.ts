import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UnitFormValues } from "@/lib/validation/unit";
import type { UnitRow } from "@/lib/queries/units";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Fields a user is allowed to set — id/created_at/organization_id/property_id are never taken from form input. */
function toUnitFields(values: UnitFormValues) {
  return {
    unit_type_id: values.unitTypeId ?? null,
    unit_code: values.unitCode,
    name: values.name ?? null,
    description: values.description ?? null,
    status: values.status,
    floor_number: values.floorNumber ?? null,
    area: values.area ?? null,
    area_unit: values.areaUnit ?? null,
    bedrooms: values.bedrooms ?? null,
    bathrooms: values.bathrooms ?? null,
  };
}

/** organization_id/property_id are derived server-side from the property being viewed — never from the form. */
export async function createUnit(
  organizationId: string,
  propertyId: string,
  values: UnitFormValues,
): Promise<MutationResult<UnitRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      ...toUnitFields(values),
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * property_id is intentionally not editable here — the approved design has
 * no "move unit to another property" control, and the task explicitly says
 * not to add that just because the column exists. Flagged as an open
 * product decision for a later phase if it's actually needed.
 */
export async function updateUnit(
  unitId: string,
  organizationId: string,
  values: UnitFormValues,
): Promise<MutationResult<UnitRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update(toUnitFields(values))
    .eq("id", unitId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
