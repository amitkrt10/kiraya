import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type LeaseStatus = Database["kiraya"]["Enums"]["lease_status"];
export type LeaseRow = Database["kiraya"]["Tables"]["leases"]["Row"];

export interface LeaseListItem extends LeaseRow {
  tenants: { display_name: string; tenant_code: string } | null;
  units: {
    unit_code: string;
    properties: { id: string; name: string; property_code: string } | null;
  } | null;
}

/**
 * Minimal lookup used only to revalidate the right pages after a mutation
 * on a lease's rent rule/billing config — those are now also managed from
 * Unit Detail (P6.3-D), not just /app/leases/[id], so callers need the
 * unit id to revalidate both.
 */
export async function getLeaseUnitId(leaseId: string, organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select("unit_id")
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load lease: ${error.message}`);
  }

  return data?.unit_id ?? null;
}

export interface GetLeasesParams {
  organizationId: string;
  search?: string;
  status?: LeaseStatus;
  tenantId?: string;
  unitId?: string;
  page?: number;
  pageSize?: number;
}

export interface GetLeasesResult {
  leases: LeaseListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

const LEASE_LIST_SELECT = "*, tenants(display_name, tenant_code), units(unit_code, properties(id, name, property_code))";

export async function getLeases(params: GetLeasesParams): Promise<GetLeasesResult> {
  const { organizationId, search, status, tenantId, unitId } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("leases")
    .select(LEASE_LIST_SELECT, { count: "exact" })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("lease_code", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  if (unitId) {
    query = query.eq("unit_id", unitId);
  }

  const { data, error, count } = await query
    .order("occupancy_start_date", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load leases: ${error.message}`);
  }

  return { leases: data ?? [], totalCount: count ?? 0, page, pageSize };
}

export interface LeaseDetail extends LeaseRow {
  tenants: { id: string; display_name: string; tenant_code: string } | null;
  units: {
    id: string;
    unit_code: string;
    properties: { id: string; name: string; property_code: string } | null;
  } | null;
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getProperty()/getTenant(). */
export async function getLease(leaseId: string, organizationId: string): Promise<LeaseDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select(
      "*, tenants(id, display_name, tenant_code), units(id, unit_code, properties(id, name, property_code))",
    )
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load lease: ${error.message}`);
  }

  return data;
}

/** All leases for one tenant (current + historical) — used by the Tenant Detail Lease tab. */
export async function getTenantLeases(tenantId: string, organizationId: string): Promise<LeaseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("occupancy_start_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tenant leases: ${error.message}`);
  }

  return data ?? [];
}

/**
 * The unit's current ACTIVE lease, if any — used by Property/Unit Detail
 * (P5.2B) to show "current tenant" alongside (never instead of) the unit's
 * own authoritative status column.
 */
export async function getUnitCurrentLease(
  unitId: string,
  organizationId: string,
): Promise<LeaseListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .eq("unit_id", unitId)
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load unit's current lease: ${error.message}`);
  }

  return data;
}

/**
 * P6.3-J: every lease (occupancy) this unit has ever had — active,
 * ended, draft, or cancelled — used to build the "Past Occupancies"
 * section on Unit Detail. Unlike getUnitCurrentLease(), this has no
 * status filter: it's the query that actually lets a unit's occupancy
 * history be listed, which nothing in the codebase did before this.
 */
export async function getUnitLeases(unitId: string, organizationId: string): Promise<LeaseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .eq("unit_id", unitId)
    .eq("organization_id", organizationId)
    .order("occupancy_start_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load unit leases: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Batched current-ACTIVE-lease lookup for a set of unit ids, keyed by
 * unit_id — used by the Property Detail Units tab so it can show each
 * unit's current tenant without an N+1 query per row. Scoped to the given
 * unit ids only (the current property's units), never the whole
 * organization. Returned as a plain object (not a Map) since this crosses
 * into a Client Component (UnitTable) via props.
 */
export async function getUnitCurrentLeasesByIds(
  unitIds: string[],
  organizationId: string,
): Promise<Record<string, LeaseListItem>> {
  if (unitIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .in("unit_id", unitIds)
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`Failed to load current leases: ${error.message}`);
  }

  const result: Record<string, LeaseListItem> = {};
  for (const lease of data ?? []) {
    if (lease.unit_id) result[lease.unit_id] = lease;
  }
  return result;
}
