import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type RentRuleRow = Database["kiraya"]["Tables"]["lease_rent_rules"]["Row"];

/** Full history, most recent effective date first — append-only, never edited in place. */
export async function getLeaseRentRules(leaseId: string, organizationId: string): Promise<RentRuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_rent_rules")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("organization_id", organizationId)
    .order("effective_from", { ascending: false });

  if (error) {
    throw new Error(`Failed to load rent rules: ${error.message}`);
  }

  return data ?? [];
}
