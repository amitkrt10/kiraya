import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UtilityRateRow = Database["kiraya"]["Tables"]["utility_rates"]["Row"];

/** All rates ever recorded for a utility (org-scoped), newest effective_from first — includes superseded/inactive rows so rate history stays visible, matching kiraya's snapshot-not-delete convention. */
export async function getUtilityRatesForUtility(utilityId: string, organizationId: string): Promise<UtilityRateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_rates")
    .select("*")
    .eq("utility_id", utilityId)
    .eq("organization_id", organizationId)
    .order("effective_from", { ascending: false });

  if (error) {
    throw new Error(`Failed to load utility rates: ${error.message}`);
  }

  return data ?? [];
}
