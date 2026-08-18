import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PropertyStatus = Database["kiraya"]["Enums"]["property_status"];
export type PropertyRow = Database["kiraya"]["Tables"]["properties"]["Row"];

export interface PropertyListItem extends PropertyRow {
  property_types: { name: string } | null;
  unit_count: number;
}

export interface PropertyPickerItem {
  id: string;
  name: string;
  property_code: string;
}

/** Lightweight, org-wide property list for pickers (e.g. the lease-create form's Property → Unit cascade). */
export async function getPropertiesForPicker(organizationId: string): Promise<PropertyPickerItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, property_code")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return data ?? [];
}

export interface GetPropertiesParams {
  organizationId: string;
  search?: string;
  propertyTypeId?: string;
  status?: PropertyStatus;
  page?: number;
  pageSize?: number;
}

export interface GetPropertiesResult {
  properties: PropertyListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

/** Escapes PostgREST ilike wildcard characters in user-supplied search text. */
function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function getProperties(params: GetPropertiesParams): Promise<GetPropertiesResult> {
  const { organizationId, search, propertyTypeId, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("*, property_types(name)", { count: "exact" })
    .eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    const term = escapeIlike(search.trim());
    query = query.or(
      `property_code.ilike.%${term}%,name.ilike.%${term}%,city.ilike.%${term}%,locality.ilike.%${term}%`,
    );
  }

  if (propertyTypeId) {
    query = query.eq("property_type_id", propertyTypeId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.order("name", { ascending: true }).range(from, to);

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  const properties = data ?? [];
  const unitCounts = await getUnitCountsByProperty(properties.map((property) => property.id));

  return {
    properties: properties.map((property) => ({
      ...property,
      unit_count: unitCounts.get(property.id) ?? 0,
    })),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

/** Scoped to just the given property ids (the current page) — never the whole organization's units. */
async function getUnitCountsByProperty(propertyIds: string[]): Promise<Map<string, number>> {
  if (propertyIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("property_id")
    .in("property_id", propertyIds);

  if (error) {
    throw new Error(`Failed to load unit counts: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1);
  }
  return counts;
}

export interface PropertyDetail extends PropertyRow {
  property_types: { id: string; name: string } | null;
}

/**
 * Scoped to the current organization explicitly (not just relying on RLS) so
 * a property that exists but belongs to a different organization the user
 * also happens to belong to returns null here — same "not found", not a
 * distinguishable "not authorized" leak.
 */
export async function getProperty(
  propertyId: string,
  organizationId: string,
): Promise<PropertyDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_types(id, name)")
    .eq("id", propertyId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    // 22P02 = invalid input syntax (a malformed id can't be cast to `uuid`)
    // — that's a not-found, not a server error. Callers should validate the
    // route param up front (see lib/utils/uuid.ts) so this is a safety net.
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data;
}

export interface PropertyUnitCounts {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  unavailableUnits: number;
  occupancyPercentage: number;
}

/**
 * Computed directly from kiraya.units rather than kiraya.v_property_occupancy,
 * which filters `where p.status = 'ACTIVE'` and would silently return zero
 * rows (not zero counts) for an INACTIVE/ARCHIVED property. Same
 * occupied/total*100 formula as that view for consistency.
 */
export async function getPropertyUnitCounts(propertyId: string): Promise<PropertyUnitCounts> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("status")
    .eq("property_id", propertyId);

  if (error) {
    throw new Error(`Failed to load unit counts: ${error.message}`);
  }

  const rows = data ?? [];
  const totalUnits = rows.length;
  const occupiedUnits = rows.filter((row) => row.status === "OCCUPIED").length;
  const vacantUnits = rows.filter((row) => row.status === "VACANT").length;
  const maintenanceUnits = rows.filter((row) => row.status === "MAINTENANCE").length;
  const unavailableUnits = rows.filter((row) => row.status === "UNAVAILABLE").length;

  return {
    totalUnits,
    occupiedUnits,
    vacantUnits,
    maintenanceUnits,
    unavailableUnits,
    occupancyPercentage: totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 10000) / 100,
  };
}
