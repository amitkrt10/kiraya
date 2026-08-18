import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PropertyType = Database["kiraya"]["Tables"]["property_types"]["Row"];

/**
 * Active property types available to this organization: its own
 * org-scoped types plus any system types (organization_id IS NULL).
 *
 * KNOWN BACKEND GAP (see P5.2B report): kiraya.can_access_organization()
 * requires organization_id IS NOT NULL, so system types never actually pass
 * RLS today regardless of this query — this queries for both anyway so it
 * self-heals the moment that RLS function is fixed, with no frontend change.
 */
export async function getPropertyTypes(organizationId: string): Promise<PropertyType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("*")
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load property types: ${error.message}`);
  }

  return data ?? [];
}
