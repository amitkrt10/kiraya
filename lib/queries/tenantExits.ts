import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getTenantBills, type BillListItem } from "./bills";
import { getBillBalance } from "./financial";

export type TenantExitRow = Database["kiraya"]["Tables"]["tenant_exits"]["Row"];
export type ExitSettlementRow = Database["kiraya"]["Tables"]["exit_settlements"]["Row"];
export type ExitSettlementItemRow = Database["kiraya"]["Tables"]["exit_settlement_items"]["Row"];
export type DepositRefundRow = Database["kiraya"]["Tables"]["deposit_refunds"]["Row"];
export type TenantCreditRefundRow = Database["kiraya"]["Tables"]["tenant_credit_refunds"]["Row"];
export type TenantExitStatus = Database["kiraya"]["Enums"]["exit_status"];

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export interface TenantExitListItem extends TenantExitRow {
  tenants: { display_name: string; tenant_code: string } | null;
  leases: {
    lease_code: string;
    units: { unit_code: string; properties: { id: string; name: string; property_code: string } | null } | null;
  } | null;
}

export interface GetTenantExitsParams {
  organizationId: string;
  search?: string;
  status?: TenantExitStatus;
  page?: number;
  pageSize?: number;
}

export interface GetTenantExitsResult {
  exits: TenantExitListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const TENANT_EXIT_LIST_SELECT =
  "*, tenants(display_name, tenant_code), leases(lease_code, units(unit_code, properties(id, name, property_code)))";

/**
 * Org-wide Tenant Exits list — read/navigation only, no settlement figures.
 * RLS (tenant_exits_select: can_access_tenant) is the actual security
 * boundary; the organization_id filter here is defense in depth, same as
 * every other list query in this codebase.
 */
export async function getTenantExits(params: GetTenantExitsParams): Promise<GetTenantExitsResult> {
  const { organizationId, search, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("tenant_exits")
    .select(TENANT_EXIT_LIST_SELECT, { count: "exact" })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("exit_reference", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`Failed to load tenant exits: ${error.message}`);
  }

  return { exits: data ?? [], totalCount: count ?? 0, page, pageSize };
}

/**
 * The tenant's most recent tenant_exits row for one specific lease, if
 * any — a lease has at most one INITIATED/PENDING_SETTLEMENT exit at a
 * time (tenant_exits_active_lease_unique_idx), but historical COMPLETED/
 * CANCELLED rows can exist too, so this always returns the newest one.
 * Used by the "Start Exit" entry point, which is reached from a specific
 * lease.
 */
export async function getTenantExitForLease(leaseId: string, organizationId: string): Promise<TenantExitRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_exits")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load tenant exit: ${error.message}`);
  }

  return data;
}

/**
 * The tenant's most recent tenant_exits row across ALL of their leases —
 * used by the Tenant Detail Exit tab, which must keep showing a completed
 * exit even after kiraya.complete_tenant_exit() has ended the lease (at
 * which point it's no longer the tenant's "current" active lease).
 */
export async function getTenantExitForTenant(tenantId: string, organizationId: string): Promise<TenantExitRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_exits")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load tenant exit: ${error.message}`);
  }

  return data;
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getTenant()/getLease(). */
export async function getTenantExit(tenantExitId: string, organizationId: string): Promise<TenantExitRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_exits")
    .select("*")
    .eq("id", tenantExitId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load tenant exit: ${error.message}`);
  }

  return data;
}

/** exit_settlements_exit_unique_idx guarantees at most one settlement per exit. */
export async function getExitSettlement(tenantExitId: string, organizationId: string): Promise<ExitSettlementRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exit_settlements")
    .select("*")
    .eq("tenant_exit_id", tenantExitId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load exit settlement: ${error.message}`);
  }

  return data;
}

/** Fetches by the settlement's own id (as opposed to getExitSettlement(), which looks up by its parent tenant_exit_id). */
export async function getExitSettlementById(exitSettlementId: string, organizationId: string): Promise<ExitSettlementRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exit_settlements")
    .select("*")
    .eq("id", exitSettlementId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load exit settlement: ${error.message}`);
  }

  return data;
}

/** All line items for a settlement — backend-ordered (sort_order, created_at), never resorted here. */
export async function getExitSettlementItems(exitSettlementId: string, organizationId: string): Promise<ExitSettlementItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exit_settlement_items")
    .select("*")
    .eq("exit_settlement_id", exitSettlementId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load exit settlement items: ${error.message}`);
  }

  return data ?? [];
}

/** Every deposit refund recorded against a settlement — backend-ordered, newest first. */
export async function getDepositRefunds(exitSettlementId: string, organizationId: string): Promise<DepositRefundRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deposit_refunds")
    .select("*")
    .eq("exit_settlement_id", exitSettlementId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load deposit refunds: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Every tenant-credit refund recorded against a settlement — Pool A
 * (P5.7F/G), mirrors getDepositRefunds() exactly (own table, own
 * backend-ordered read). Never queried alongside deposit_refunds in a
 * single call — the two histories are kept structurally separate all
 * the way to the UI.
 */
export async function getTenantCreditRefunds(exitSettlementId: string, organizationId: string): Promise<TenantCreditRefundRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_credit_refunds")
    .select("*")
    .eq("exit_settlement_id", exitSettlementId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tenant credit refunds: ${error.message}`);
  }

  return data ?? [];
}

export type ExitTenantStatementRow = Database["kiraya"]["Views"]["v_exit_tenant_statement"]["Row"];

/** kiraya.v_exit_tenant_statement — the authoritative Final Statement source, computes nothing here. */
export async function getExitTenantStatement(exitSettlementId: string, organizationId: string): Promise<ExitTenantStatementRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_exit_tenant_statement")
    .select("*")
    .eq("exit_settlement_id", exitSettlementId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load exit statement: ${error.message}`);
  }

  return data;
}

export interface OutstandingBillItem extends BillListItem {
  balance: number;
}

/**
 * Every unpaid bill for this tenant, itemized, each with its authoritative
 * kiraya.get_bill_balance() — the same FINALIZED/PARTIALLY_PAID status set
 * kiraya.allocate_payment_to_bills() itself treats as still-outstanding.
 * The total shown alongside this list must come from getTenantOutstanding()
 * (kiraya.get_tenant_due()), never a sum of these balances.
 */
export async function getOutstandingBillsForTenant(tenantId: string, organizationId: string): Promise<OutstandingBillItem[]> {
  const bills = await getTenantBills(tenantId, organizationId);
  const outstandingBills = bills.filter((bill) => bill.status === "FINALIZED" || bill.status === "PARTIALLY_PAID");

  const balances = await Promise.all(outstandingBills.map((bill) => getBillBalance(bill.id)));

  return outstandingBills.map((bill, index) => ({ ...bill, balance: balances[index] ?? 0 }));
}
