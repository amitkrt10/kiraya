import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type LeasePartyRow = Database["kiraya"]["Tables"]["lease_parties"]["Row"];

export interface LeasePartyItem extends LeasePartyRow {
  tenants: { id: string; display_name: string } | null;
}

export async function getLeaseParties(leaseId: string, organizationId: string): Promise<LeasePartyItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_parties")
    .select("*, tenants(id, display_name)")
    .eq("lease_id", leaseId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load lease parties: ${error.message}`);
  }

  return data ?? [];
}
