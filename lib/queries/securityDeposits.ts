import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SecurityDepositRow = Database["kiraya"]["Tables"]["security_deposits"]["Row"];
export type SecurityDepositTransactionRow = Database["kiraya"]["Tables"]["security_deposit_transactions"]["Row"];
export type DepositTransactionType = "RECEIPT" | "DEDUCTION" | "REFUND" | "ADJUSTMENT";

/**
 * The tenant's security deposit, if one has been recorded. Required/
 * received/deducted/refunded/status all come straight from the row's
 * own columns — kept authoritatively in sync by kiraya.
 * sync_security_deposit_summary() on every posted transaction, never
 * summed here. A tenant with no deposit configured (a genuinely
 * different state from a deposit with zero held balance) returns null.
 */
export async function getSecurityDeposit(tenantId: string, organizationId: string): Promise<SecurityDepositRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_deposits")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load security deposit: ${error.message}`);
  }

  return data;
}

/** kiraya.get_security_deposit_held() — the one figure with no cached column on security_deposits, always computed fresh. */
export async function getSecurityDepositHeld(securityDepositId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_security_deposit_held", { p_security_deposit_id: securityDepositId });
  if (error) {
    throw new Error(`Failed to load deposit held amount: ${error.message}`);
  }
  return data ?? 0;
}

/** Full transaction history for one deposit, newest first — chronological ordering from the database, never resorted in the UI. */
export async function getSecurityDepositTransactions(
  securityDepositId: string,
  organizationId: string,
): Promise<SecurityDepositTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_deposit_transactions")
    .select("*")
    .eq("security_deposit_id", securityDepositId)
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load deposit transactions: ${error.message}`);
  }

  return data ?? [];
}
