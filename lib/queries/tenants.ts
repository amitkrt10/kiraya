import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TenantStatus = Database["kiraya"]["Enums"]["tenant_status"];
export type TenantType = Database["kiraya"]["Enums"]["tenant_type"];
export type TenantRow = Database["kiraya"]["Tables"]["tenants"]["Row"];

export interface TenantListItem extends TenantRow {
  current_property_name: string | null;
  current_unit_code: string | null;
}

export interface TenantPickerItem {
  id: string;
  tenant_code: string;
  display_name: string;
}

/** Lightweight, org-wide tenant list for the lease-create form's tenant picker. */
export async function getTenantsForPicker(organizationId: string): Promise<TenantPickerItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, tenant_code, display_name")
    .eq("organization_id", organizationId)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tenants: ${error.message}`);
  }

  return data ?? [];
}

export interface GetTenantsParams {
  organizationId: string;
  search?: string;
  status?: TenantStatus;
  page?: number;
  pageSize?: number;
}

export interface GetTenantsResult {
  tenants: TenantListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function getTenants(params: GetTenantsParams): Promise<GetTenantsResult> {
  const { organizationId, search, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("tenants")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    const term = escapeIlike(search.trim());
    query = query.or(
      `tenant_code.ilike.%${term}%,display_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.order("display_name", { ascending: true }).range(from, to);

  if (error) {
    throw new Error(`Failed to load tenants: ${error.message}`);
  }

  const tenants = data ?? [];
  const leaseContext = await getCurrentLeaseContextByTenant(tenants.map((tenant) => tenant.id));

  return {
    tenants: tenants.map((tenant) => ({
      ...tenant,
      current_property_name: leaseContext.get(tenant.id)?.propertyName ?? null,
      current_unit_code: leaseContext.get(tenant.id)?.unitCode ?? null,
    })),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

interface LeaseContext {
  propertyName: string;
  unitCode: string;
}

/**
 * Current property/unit per tenant, derived from their ACTIVE lease (a
 * tenant has no direct unit/property column — the relationship only exists
 * through kiraya.leases). Scoped to just the given tenant ids (the current
 * page), never the whole organization. If a tenant somehow has more than one
 * concurrent ACTIVE lease (different units — the overlap rule only blocks
 * overlap on the *same* unit), the first one found is shown here; the tenant
 * detail page's lease list shows the full picture.
 */
async function getCurrentLeaseContextByTenant(tenantIds: string[]): Promise<Map<string, LeaseContext>> {
  if (tenantIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .select("tenant_id, units(unit_code, properties(name))")
    .in("tenant_id", tenantIds)
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(`Failed to load lease context: ${error.message}`);
  }

  const map = new Map<string, LeaseContext>();
  for (const row of data ?? []) {
    if (map.has(row.tenant_id)) continue;
    const unit = row.units;
    if (unit) {
      map.set(row.tenant_id, {
        unitCode: unit.unit_code,
        propertyName: unit.properties?.name ?? "",
      });
    }
  }
  return map;
}

/**
 * Scoped to the current organization explicitly (not just relying on RLS) so
 * a tenant that exists but belongs to a different organization the user also
 * happens to belong to returns null here — same "not found," not a
 * distinguishable "not authorized" leak.
 */
export async function getTenant(tenantId: string, organizationId: string): Promise<TenantRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load tenant: ${error.message}`);
  }

  return data;
}
