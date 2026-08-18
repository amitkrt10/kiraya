import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UnitType = Database["kiraya"]["Tables"]["unit_types"]["Row"];

/** Same organization-plus-system-types shape and RLS caveat as getPropertyTypes(). */
export async function getUnitTypes(organizationId: string): Promise<UnitType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unit_types")
    .select("*")
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load unit types: ${error.message}`);
  }

  return data ?? [];
}
