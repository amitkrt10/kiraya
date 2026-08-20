import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type LedgerEntryType = Database["kiraya"]["Enums"]["ledger_entry_type"];
export type LedgerEntryRow = Database["kiraya"]["Views"]["v_tenant_ledger"]["Row"];

export interface GetLedgerEntriesParams {
  organizationId: string;
  tenantId?: string;
  propertyId?: string;
  entryType?: LedgerEntryType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface GetLedgerEntriesResult {
  entries: LedgerEntryRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;
const EXPORT_ROW_LIMIT = 10000;

/** No property-lease matched — a sentinel that can never equal a real lease_id, so an `in (...)` filter safely yields zero rows instead of behaving like "no filter." */
const NO_MATCH_LEASE_ID = "00000000-0000-0000-0000-000000000000";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * kiraya.v_tenant_ledger has no property_id column of its own (an entry
 * spans tenant/lease/bill/payment, not a unit) — so a property filter is
 * resolved as a separate, focused query for that property's lease ids,
 * then applied as an `in (...)` filter on the view. This is still
 * server-side filtering (two targeted Postgres queries), never a fetch-all
 * followed by filtering in application code.
 */
async function resolvePropertyLeaseIds(
  supabase: SupabaseServerClient,
  organizationId: string,
  propertyId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("leases")
    .select("id, units!inner(property_id)")
    .eq("organization_id", organizationId)
    .eq("units.property_id", propertyId);

  if (error) {
    throw new Error(`Failed to resolve property leases: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id);
}

/** Org-wide or tenant-scoped ledger, paginated, filtered entirely in Postgres — every value (including running_balance) comes straight from kiraya.v_tenant_ledger, never recomputed here. */
export async function getLedgerEntries(params: GetLedgerEntriesParams): Promise<GetLedgerEntriesResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const propertyLeaseIds = params.propertyId
    ? await resolvePropertyLeaseIds(supabase, params.organizationId, params.propertyId)
    : undefined;

  let query = supabase.from("v_tenant_ledger").select("*", { count: "exact" }).eq("organization_id", params.organizationId);
  if (params.tenantId) query = query.eq("tenant_id", params.tenantId);
  if (propertyLeaseIds) query = query.in("lease_id", propertyLeaseIds.length > 0 ? propertyLeaseIds : [NO_MATCH_LEASE_ID]);
  if (params.entryType) query = query.eq("entry_type", params.entryType);
  if (params.dateFrom) query = query.gte("entry_date", params.dateFrom);
  if (params.dateTo) query = query.lte("entry_date", params.dateTo);

  const { data, error, count } = await query
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load ledger entries: ${error.message}`);
  }

  return { entries: data ?? [], totalCount: count ?? 0, page, pageSize };
}

/** Same authoritative query and filters as getLedgerEntries(), unpaginated (capped) — the sole source for CSV export, so exported rows can never diverge from what the table would show. */
export async function getLedgerEntriesForExport(
  params: Omit<GetLedgerEntriesParams, "page" | "pageSize">,
): Promise<LedgerEntryRow[]> {
  const supabase = await createClient();

  const propertyLeaseIds = params.propertyId
    ? await resolvePropertyLeaseIds(supabase, params.organizationId, params.propertyId)
    : undefined;

  let query = supabase.from("v_tenant_ledger").select("*").eq("organization_id", params.organizationId);
  if (params.tenantId) query = query.eq("tenant_id", params.tenantId);
  if (propertyLeaseIds) query = query.in("lease_id", propertyLeaseIds.length > 0 ? propertyLeaseIds : [NO_MATCH_LEASE_ID]);
  if (params.entryType) query = query.eq("entry_type", params.entryType);
  if (params.dateFrom) query = query.gte("entry_date", params.dateFrom);
  if (params.dateTo) query = query.lte("entry_date", params.dateTo);

  const { data, error } = await query
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(EXPORT_ROW_LIMIT);

  if (error) {
    throw new Error(`Failed to load ledger entries for export: ${error.message}`);
  }

  return data ?? [];
}
