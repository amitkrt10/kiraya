import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PaymentMethodType = Database["kiraya"]["Enums"]["payment_method_type"];
export type PaymentMethodRow = Database["kiraya"]["Tables"]["payment_methods"]["Row"];

/**
 * Payment methods may be organization-specific (organization_id set) or
 * global/platform-provided (organization_id null) — the RLS select policy
 * explicitly allows both (`organization_id is null or can_access_organization(...)`).
 * Both are fetched together here; nothing is hard-coded.
 */
export async function getPaymentMethods(organizationId: string): Promise<PaymentMethodRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load payment methods: ${error.message}`);
  }

  return data ?? [];
}

export interface PaymentMethodPickerItem {
  id: string;
  name: string;
  method_type: PaymentMethodType;
}

/** Active methods only, for the Record Payment picker. */
export async function getActivePaymentMethodsForPicker(organizationId: string): Promise<PaymentMethodPickerItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, name, method_type")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load payment methods: ${error.message}`);
  }

  return data ?? [];
}
