import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MeterFormValues } from "@/lib/validation/meter";
import type { MeterRow } from "@/lib/queries/meters";
import { translateDatabaseError, type MutationResult } from "./errors";

export async function createMeter(organizationId: string, values: MeterFormValues): Promise<MutationResult<MeterRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .insert({
      organization_id: organizationId,
      utility_id: values.utilityId,
      property_id: values.scope === "PROPERTY" ? values.propertyId : null,
      unit_id: values.scope === "UNIT" ? values.unitId : null,
      meter_code: values.meterCode,
      meter_type: values.meterType,
      serial_number: values.serialNumber ?? null,
      unit_name: values.unitName ?? "unit",
      multiplier: values.multiplier ?? 1,
      installed_on: values.installedOn ?? null,
      initial_reading: values.initialReading ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Deactivate only — this checkpoint deliberately does not implement
 * editing meter.unit_id/property_id once a meter exists. Reassigning a
 * meter to a different unit after it has recorded readings is a known,
 * pre-existing backend gap (no history-preserving guard — see the
 * P5.5A/P5.5C investigations); rather than build UI around it, meter
 * scope is treated as set-once, and retiring a meter is done by
 * deactivating it, matching the established utility_configurations/
 * utility_rates convention.
 */
export async function deactivateMeter(meterId: string, organizationId: string): Promise<MutationResult<MeterRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .update({ is_active: false })
    .eq("id", meterId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
