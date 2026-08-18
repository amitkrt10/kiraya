import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BillingConfigRow = Database["kiraya"]["Tables"]["lease_billing_configs"]["Row"];

/** Full history, most recent effective date first — append-only, never edited in place. */
export async function getLeaseBillingConfigs(
  leaseId: string,
  organizationId: string,
): Promise<BillingConfigRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_billing_configs")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("organization_id", organizationId)
    .order("effective_from", { ascending: false });

  if (error) {
    throw new Error(`Failed to load billing configuration: ${error.message}`);
  }

  return data ?? [];
}
