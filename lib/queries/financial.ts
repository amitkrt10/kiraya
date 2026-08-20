import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Thin, typed wrappers around the authoritative financial RPCs — this file
 * computes nothing itself. Every number returned here comes directly from
 * PostgreSQL (kiraya.get_tenant_balance/get_tenant_credit/get_bill_balance/
 * get_bill_paid_amount), never summed or derived in TypeScript.
 */

/** Net amount due (>= 0) — kiraya.get_tenant_due(), the authoritative "Outstanding" source. */
export async function getTenantOutstanding(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_tenant_due", { p_tenant_id: tenantId });
  if (error) {
    throw new Error(`Failed to load tenant outstanding: ${error.message}`);
  }
  return data ?? 0;
}

/** Authoritative "Available Credit" — kiraya.get_tenant_credit(). */
export async function getTenantCredit(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_tenant_credit", { p_tenant_id: tenantId });
  if (error) {
    throw new Error(`Failed to load tenant credit: ${error.message}`);
  }
  return data ?? 0;
}

/** Authoritative remaining balance on one bill — kiraya.get_bill_balance(). */
export async function getBillBalance(billId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_bill_balance", { p_bill_id: billId });
  if (error) {
    throw new Error(`Failed to load bill balance: ${error.message}`);
  }
  return data ?? 0;
}

/** Authoritative amount paid so far on one bill — kiraya.get_bill_paid_amount(). */
export async function getBillPaidAmount(billId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_bill_paid_amount", { p_bill_id: billId });
  if (error) {
    throw new Error(`Failed to load bill paid amount: ${error.message}`);
  }
  return data ?? 0;
}
