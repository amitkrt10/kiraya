import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SecurityDepositRow = Database["kiraya"]["Tables"]["security_deposits"]["Row"];
export type SecurityDepositTransactionRow = Database["kiraya"]["Tables"]["security_deposit_transactions"]["Row"];
export type DepositTransactionType = "RECEIPT" | "DEDUCTION" | "REFUND" | "ADJUSTMENT";
export type SecurityDepositStatus = Database["kiraya"]["Enums"]["deposit_status"];

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export interface SecurityDepositListItem extends SecurityDepositRow {
  tenants: { display_name: string; tenant_code: string } | null;
  leases: {
    lease_code: string;
    units: { unit_code: string; properties: { id: string; name: string; property_code: string } | null } | null;
  } | null;
  /** kiraya.get_security_deposit_held() per row — no cached column exists, same reason as getSecurityDepositHeld() below. */
  held: number;
}

export interface GetSecurityDepositsParams {
  organizationId: string;
  search?: string;
  status?: SecurityDepositStatus;
  page?: number;
  pageSize?: number;
}

export interface GetSecurityDepositsResult {
  deposits: SecurityDepositListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const SECURITY_DEPOSIT_LIST_SELECT =
  "*, tenants(display_name, tenant_code), leases(lease_code, units(unit_code, properties(id, name, property_code)))";

/**
 * Org-wide Security Deposits overview — read/navigation only. Required/
 * Received/Deducted/Refunded/status all come straight from the row (kept
 * authoritatively in sync by kiraya.sync_security_deposit_summary()); Held
 * has no cached column so it's fetched per row via the same RPC the
 * Tenant Detail Deposit tab uses, bounded to one page (<= pageSize calls),
 * the same batching precedent as getOutstandingBillsForTenant().
 */
export async function getSecurityDeposits(params: GetSecurityDepositsParams): Promise<GetSecurityDepositsResult> {
  const { organizationId, search, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("security_deposits")
    .select(SECURITY_DEPOSIT_LIST_SELECT, { count: "exact" })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("deposit_reference", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`Failed to load security deposits: ${error.message}`);
  }

  const rows = data ?? [];
  const heldAmounts = await Promise.all(rows.map((row) => getSecurityDepositHeld(row.id)));
  const deposits: SecurityDepositListItem[] = rows.map((row, index) => ({ ...row, held: heldAmounts[index] ?? 0 }));

  return { deposits, totalCount: count ?? 0, page, pageSize };
}

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
