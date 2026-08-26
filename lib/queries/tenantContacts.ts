import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TenantContactRow = Database["kiraya"]["Tables"]["tenant_contacts"]["Row"];
export type TenantContactType = Database["kiraya"]["Enums"]["tenant_contact_type"];

/**
 * Every contact slot (up to 2 EMERGENCY + 2 LOCAL_REFERENCE) recorded for
 * a tenant — tenant_contacts_slot_unique_idx guarantees at most one row
 * per (tenant_id, contact_type, sort_order), so this is never more than
 * 4 rows. Callers pick out individual slots by (contact_type, sort_order)
 * rather than relying on array position.
 */
export async function getTenantContacts(tenantId: string, organizationId: string): Promise<TenantContactRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("contact_type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tenant contacts: ${error.message}`);
  }

  return data ?? [];
}
