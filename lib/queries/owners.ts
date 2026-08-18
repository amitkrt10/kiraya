import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type OwnerRow = Database["kiraya"]["Tables"]["owners"]["Row"];
export type PropertyOwnershipRow = Database["kiraya"]["Tables"]["property_ownerships"]["Row"];

/** All owner master records for the organization — used to populate the ownership-assignment picker. */
export async function getOwners(organizationId: string): Promise<OwnerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("organization_id", organizationId)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load owners: ${error.message}`);
  }

  return data ?? [];
}

export interface PropertyOwnershipItem extends PropertyOwnershipRow {
  owners: { id: string; display_name: string; phone: string | null; email: string | null } | null;
}

/**
 * Ownership records for one property, including ended interests (the Owners
 * tab shows the full history, not just currently-active percentages) — sorted
 * active-first, highest stake first.
 */
export async function getPropertyOwnerships(
  propertyId: string,
  organizationId: string,
): Promise<PropertyOwnershipItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_ownerships")
    .select("*, owners(id, display_name, phone, email)")
    .eq("property_id", propertyId)
    .eq("organization_id", organizationId)
    .order("ownership_end_date", { ascending: true, nullsFirst: true })
    .order("ownership_percentage", { ascending: false });

  if (error) {
    throw new Error(`Failed to load property ownerships: ${error.message}`);
  }

  return data ?? [];
}
