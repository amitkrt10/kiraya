import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BillStatus = Database["kiraya"]["Enums"]["bill_status"];
export type BillRow = Database["kiraya"]["Tables"]["bills"]["Row"];
export type BillItemRow = Database["kiraya"]["Tables"]["bill_items"]["Row"];
export type BillAdjustmentRow = Database["kiraya"]["Tables"]["bill_adjustments"]["Row"];

export interface BillListItem extends BillRow {
  tenants: { id: string; display_name: string; tenant_code: string } | null;
  units: { unit_code: string; properties: { id: string; name: string } | null } | null;
}

export interface GetBillsParams {
  organizationId: string;
  search?: string;
  status?: BillStatus;
  propertyId?: string;
  tenantId?: string;
  leaseId?: string;
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  pageSize?: number;
}

export interface GetBillsResult {
  bills: BillListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

const BILL_LIST_SELECT = "*, tenants(id, display_name, tenant_code), units(unit_code, properties(id, name))";

export async function getBills(params: GetBillsParams): Promise<GetBillsResult> {
  const { organizationId, search, status, propertyId, tenantId, leaseId, periodStart, periodEnd } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("bills")
    .select(propertyId ? `${BILL_LIST_SELECT}, units!inner(unit_code, properties!inner(id, name))` : BILL_LIST_SELECT, {
      count: "exact",
    })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("bill_number", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (propertyId) {
    query = query.eq("units.property_id", propertyId);
  }
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  if (leaseId) {
    query = query.eq("lease_id", leaseId);
  }
  if (periodStart) {
    query = query.gte("period_start", periodStart);
  }
  if (periodEnd) {
    query = query.lte("period_end", periodEnd);
  }

  const { data, error, count } = await query.order("bill_date", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`Failed to load bills: ${error.message}`);
  }

  return { bills: (data ?? []) as unknown as BillListItem[], totalCount: count ?? 0, page, pageSize };
}

export interface BillDetail extends BillRow {
  tenants: { id: string; display_name: string; tenant_code: string } | null;
  leases: { id: string; lease_code: string } | null;
  units: {
    id: string;
    unit_code: string;
    properties: { id: string; name: string; property_code: string } | null;
  } | null;
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getProperty()/getTenant(). */
export async function getBill(billId: string, organizationId: string): Promise<BillDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      "*, tenants(id, display_name, tenant_code), leases(id, lease_code), units(id, unit_code, properties(id, name, property_code))",
    )
    .eq("id", billId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load bill: ${error.message}`);
  }

  return data;
}

export async function getBillItems(billId: string, organizationId: string): Promise<BillItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bill_items")
    .select("*")
    .eq("bill_id", billId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load bill items: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Read-only display of any recorded adjustments — kiraya.bill_adjustments
 * has no trigger syncing into bills.adjustment_amount, so creating rows
 * here has no automatic financial effect today. P5.2D therefore only
 * displays existing adjustments (per task instruction: "if adjustment
 * creation is supported by the existing business rules, implement it...
 * otherwise do not invent it" — the backend doesn't wire creation to any
 * financial effect, so no creation UI is built).
 */
/**
 * Sum of posted (non-reversed) CREDIT_APPLICATION ledger entries against
 * this bill — a plain total of already-authoritative rows kiraya.
 * apply_tenant_credit_to_bill() itself posted, not an independently
 * computed financial value.
 */
export async function getBillCreditApplied(billId: string, organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("debit_amount")
    .eq("bill_id", billId)
    .eq("organization_id", organizationId)
    .eq("entry_type", "CREDIT_APPLICATION")
    .eq("is_reversal", false);

  if (error) {
    throw new Error(`Failed to load credit applied to this bill: ${error.message}`);
  }

  return (data ?? []).reduce((sum, row) => sum + row.debit_amount, 0);
}

export async function getBillAdjustments(billId: string, organizationId: string): Promise<BillAdjustmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bill_adjustments")
    .select("*")
    .eq("bill_id", billId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load bill adjustments: ${error.message}`);
  }

  return data ?? [];
}

export interface BillStatusCounts {
  DRAFT: number;
  FINALIZED: number;
  PARTIALLY_PAID: number;
  PAID: number;
  VOID: number;
}

const BILL_STATUSES: BillStatus[] = ["DRAFT", "FINALIZED", "PARTIALLY_PAID", "PAID", "VOID"];

/** Authoritative per-status bill counts for the Billing Dashboard KPI tiles — one COUNT per status, computed in Postgres, never summed client-side. */
export async function getBillStatusCounts(organizationId: string): Promise<BillStatusCounts> {
  const supabase = await createClient();
  const results = await Promise.all(
    BILL_STATUSES.map((status) =>
      supabase.from("bills").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", status),
    ),
  );

  const counts: BillStatusCounts = { DRAFT: 0, FINALIZED: 0, PARTIALLY_PAID: 0, PAID: 0, VOID: 0 };
  BILL_STATUSES.forEach((status, index) => {
    const result = results[index];
    if (!result || result.error) {
      throw new Error(`Failed to load bill status counts: ${result?.error?.message ?? "unknown error"}`);
    }
    counts[status] = result.count ?? 0;
  });
  return counts;
}

/** All bills for one lease — used by the Lease Detail Bills tab / tenant context. */
export async function getLeaseBills(leaseId: string, organizationId: string): Promise<BillListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select(BILL_LIST_SELECT)
    .eq("lease_id", leaseId)
    .eq("organization_id", organizationId)
    .order("period_start", { ascending: false });

  if (error) {
    throw new Error(`Failed to load lease bills: ${error.message}`);
  }

  return data ?? [];
}

/** All bills for one tenant (across leases) — used by the Tenant Detail Bills tab. */
export async function getTenantBills(tenantId: string, organizationId: string): Promise<BillListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select(BILL_LIST_SELECT)
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("period_start", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tenant bills: ${error.message}`);
  }

  return data ?? [];
}
