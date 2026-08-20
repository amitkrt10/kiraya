import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BillingRunStatus = Database["kiraya"]["Enums"]["billing_run_status"];
export type BillingRunRow = Database["kiraya"]["Tables"]["billing_runs"]["Row"];

export interface BillingRunListItem extends BillingRunRow {
  properties: { id: string; name: string } | null;
}

export interface GetBillingRunsParams {
  organizationId: string;
  status?: BillingRunStatus;
  page?: number;
  pageSize?: number;
}

export interface GetBillingRunsResult {
  runs: BillingRunListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

const BILLING_RUN_SELECT = "*, properties(id, name)";

export async function getBillingRuns(params: GetBillingRunsParams): Promise<GetBillingRunsResult> {
  const { organizationId, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase.from("billing_runs").select(BILLING_RUN_SELECT, { count: "exact" }).eq("organization_id", organizationId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`Failed to load billing runs: ${error.message}`);
  }

  return { runs: data ?? [], totalCount: count ?? 0, page, pageSize };
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getProperty()/getTenant(). */
export async function getBillingRun(runId: string, organizationId: string): Promise<BillingRunListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_runs")
    .select(BILLING_RUN_SELECT)
    .eq("id", runId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load billing run: ${error.message}`);
  }

  return data;
}

export interface BillingRunBillItem {
  id: string;
  bill_number: string;
  status: Database["kiraya"]["Enums"]["bill_status"];
  total_amount: number;
  tenants: { display_name: string } | null;
  units: { unit_code: string } | null;
}

/** Bills this run actually produced — for the run detail page's drill-down into results. */
export async function getBillingRunBills(runId: string, organizationId: string): Promise<BillingRunBillItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id, bill_number, status, total_amount, tenants(display_name), units(unit_code)")
    .eq("billing_run_id", runId)
    .eq("organization_id", organizationId)
    .order("bill_number", { ascending: true });

  if (error) {
    throw new Error(`Failed to load this run's bills: ${error.message}`);
  }

  return data ?? [];
}

export interface BillingRunFailure {
  id: string;
  resource_id: string;
  description: string | null;
  created_at: string;
  leaseCode: string | null;
  tenantName: string | null;
  unitCode: string | null;
}

/**
 * Best-effort drill-down into why leases failed during this run.
 * kiraya.generate_billing_run() logs each per-lease failure to
 * kiraya.audit_logs (action='BILL_GENERATION_FAILED', resource_type='LEASE',
 * resource_id=lease id, description=sqlerrm) but does NOT store the
 * billing_run_id on that row — there is no FK to correlate by. This
 * correlates by organization + the run's own period + a timestamp window
 * bounded by the run's started_at/completed_at, which is exact for any
 * realistic single-run-at-a-time usage pattern (audit_logs has no other way
 * to identify "which run" a failure belongs to; not something this query
 * can invent without a schema change).
 */
export async function getBillingRunFailures(run: BillingRunRow): Promise<BillingRunFailure[]> {
  if (run.failed_bills === 0) return [];

  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("id, resource_id, description, created_at, new_data")
    .eq("organization_id", run.organization_id)
    .eq("action", "BILL_GENERATION_FAILED");

  if (run.started_at) {
    query = query.gte("created_at", run.started_at);
  }
  if (run.completed_at) {
    query = query.lte("created_at", run.completed_at);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load this run's failures: ${error.message}`);
  }

  const rows = (data ?? []).filter((row) => {
    const newData = row.new_data as { period_start?: string; period_end?: string } | null;
    return newData?.period_start === run.period_start && newData?.period_end === run.period_end;
  });

  if (rows.length === 0) return [];

  const leaseIds = rows.map((row) => row.resource_id).filter((id): id is string => Boolean(id));
  const { data: leases } = await supabase
    .from("leases")
    .select("id, lease_code, tenants(display_name), units(unit_code)")
    .in("id", leaseIds);

  const leaseById = new Map((leases ?? []).map((lease) => [lease.id, lease]));

  return rows.map((row) => {
    const lease = row.resource_id ? leaseById.get(row.resource_id) : undefined;
    return {
      id: row.id,
      resource_id: row.resource_id ?? "",
      description: row.description,
      created_at: row.created_at,
      leaseCode: lease?.lease_code ?? null,
      tenantName: lease?.tenants?.display_name ?? null,
      unitCode: lease?.units?.unit_code ?? null,
    };
  });
}

/**
 * Read-only preview of how many ACTIVE leases currently match a billing
 * scope — mirrors kiraya.generate_billing_run()'s own WHERE clause exactly
 * (organization + optional property + occupancy overlapping the period).
 * This is explicitly a preview/estimate: the actual count generate_billing_run()
 * acts on at execution time may differ if leases change between preview and
 * submit — the RPC itself remains the sole financial authority.
 */
export async function getBillingScopePreviewCount(
  organizationId: string,
  propertyId: string | undefined,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("leases")
    .select("id, units!inner(property_id)", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE")
    .lte("occupancy_start_date", periodEnd)
    .or(`actual_end_date.is.null,actual_end_date.gte.${periodStart}`);

  if (propertyId) {
    query = query.eq("units.property_id", propertyId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to preview billing scope: ${error.message}`);
  }

  return count ?? 0;
}
