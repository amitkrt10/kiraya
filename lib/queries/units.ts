import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UnitStatus = Database["kiraya"]["Enums"]["unit_status"];
export type UnitRow = Database["kiraya"]["Tables"]["units"]["Row"];

export interface UnitListItem extends UnitRow {
  unit_types: { name: string } | null;
}

/** Units belonging to one property — scoped to the organization for the same not-found-vs-leak reasons as getProperty(). */
export async function getPropertyUnits(
  propertyId: string,
  organizationId: string,
): Promise<UnitListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, unit_types(name)")
    .eq("property_id", propertyId)
    .eq("organization_id", organizationId)
    .order("unit_code", { ascending: true });

  if (error) {
    throw new Error(`Failed to load units: ${error.message}`);
  }

  return data ?? [];
}

export interface UnitDetail extends UnitRow {
  unit_types: { id: string; name: string } | null;
  properties: { id: string; name: string; property_code: string } | null;
}

export async function getUnit(unitId: string, organizationId: string): Promise<UnitDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, unit_types(id, name), properties(id, name, property_code)")
    .eq("id", unitId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load unit: ${error.message}`);
  }

  return data;
}
