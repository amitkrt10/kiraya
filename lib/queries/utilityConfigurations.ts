import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UtilityConfigurationRow = Database["kiraya"]["Tables"]["utility_configurations"]["Row"];

export interface UtilityConfigurationListItem extends UtilityConfigurationRow {
  properties: { id: string; name: string; property_code: string } | null;
  units: { id: string; unit_code: string; property_id: string } | null;
}

const CONFIGURATION_SELECT = "*, properties(id, name, property_code), units(id, unit_code, property_id)";

/**
 * Every configuration for one utility, both property-default and unit-
 * override rows — the caller (Configuration page) splits them by
 * `unit_id === null` for display, matching the approved design's two
 * separate sections. Ordered oldest-effective-first within each scope so
 * a superseded (deactivated) row still reads in a sensible history order.
 */
export async function getUtilityConfigurationsForUtility(
  utilityId: string,
  organizationId: string,
): Promise<UtilityConfigurationListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_configurations")
    .select(CONFIGURATION_SELECT)
    .eq("utility_id", utilityId)
    .eq("organization_id", organizationId)
    .order("effective_from", { ascending: false });

  if (error) {
    throw new Error(`Failed to load utility configurations: ${error.message}`);
  }

  return data ?? [];
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getTenant()/getLease(). */
export async function getUtilityConfiguration(
  configurationId: string,
  organizationId: string,
): Promise<UtilityConfigurationListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_configurations")
    .select(CONFIGURATION_SELECT)
    .eq("id", configurationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load utility configuration: ${error.message}`);
  }

  return data;
}

/**
 * Which units currently override the property default for this utility —
 * used only to caption the property-default row ("Overridden at: …"), a
 * plain existence read of already-loaded configuration rows, never a
 * financial calculation.
 */
export function getOverridingUnitLabels(configurations: UtilityConfigurationListItem[]): string[] {
  return configurations.filter((config) => config.unit_id !== null && config.is_active).map((config) => config.units?.unit_code ?? "—");
}
