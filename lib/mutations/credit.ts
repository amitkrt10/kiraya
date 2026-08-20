import "server-only";
import { createClient } from "@/lib/supabase/server";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Calls the authoritative kiraya.apply_tenant_credit_to_bill() RPC — never
 * a direct insert into ledger_entries/payment_allocations/bills from this
 * app. The database independently re-derives and clamps the amount actually
 * applied (kiraya.get_tenant_credit()/kiraya.get_bill_balance(), taken
 * under a tenant-scoped advisory lock); this function returns only the new
 * ledger entry id, so callers must re-fetch bill/tenant financial state
 * afterward rather than assuming the requested amount was applied in full.
 */
export async function applyTenantCreditToBill(
  billId: string,
  amount: number,
  createdBy: string,
): Promise<MutationResult<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_tenant_credit_to_bill", {
    p_bill_id: billId,
    p_amount: amount,
    p_created_by: createdBy,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
