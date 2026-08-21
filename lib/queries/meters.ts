import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MeterRow = Database["kiraya"]["Tables"]["meters"]["Row"];

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export interface MeterListItem extends MeterRow {
  utilities: { id: string; name: string } | null;
  units: { id: string; unit_code: string; properties: { id: string; name: string } | null } | null;
  properties: { id: string; name: string } | null;
  /** kiraya.meter_readings' own most recent row for this meter — a plain lookup, never computed here. */
  latest_reading: { reading_value: number; reading_date: string } | null;
}

export interface GetMetersParams {
  organizationId: string;
  search?: string;
  utilityId?: string;
  status?: "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface GetMetersResult {
  meters: MeterListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const METER_SELECT = "*, utilities(id, name), units(id, unit_code, properties(id, name)), properties(id, name)";

/**
 * Org-wide meter list. "Latest Reading" is fetched per row via a batched
 * lookup (Promise.all, bounded to one page) — the same precedent already
 * established by getOutstandingBillsForTenant()/getSecurityDeposits() for
 * a per-row value with no cached column on the parent table.
 */
export async function getMeters(params: GetMetersParams): Promise<GetMetersResult> {
  const { organizationId, search, utilityId, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase.from("meters").select(METER_SELECT, { count: "exact" }).eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("meter_code", `%${escapeIlike(search.trim())}%`);
  }
  if (utilityId) {
    query = query.eq("utility_id", utilityId);
  }
  if (status) {
    query = query.eq("is_active", status === "active");
  }

  const { data, error, count } = await query.order("meter_code", { ascending: true }).range(from, to);

  if (error) {
    throw new Error(`Failed to load meters: ${error.message}`);
  }

  const rows = data ?? [];
  const latestReadings = await Promise.all(
    rows.map(async (row) => {
      const { data: reading, error: readingError } = await supabase
        .from("meter_readings")
        .select("reading_value, reading_date")
        .eq("meter_id", row.id)
        .order("reading_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (readingError) {
        throw new Error(`Failed to load latest reading: ${readingError.message}`);
      }
      return reading;
    }),
  );

  const meters: MeterListItem[] = rows.map((row, index) => ({ ...row, latest_reading: latestReadings[index] ?? null }));

  return { meters, totalCount: count ?? 0, page, pageSize };
}

export interface MeterDetail extends MeterRow {
  utilities: { id: string; name: string; is_metered: boolean } | null;
  units: { id: string; unit_code: string; properties: { id: string; name: string } | null } | null;
  properties: { id: string; name: string } | null;
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getTenant()/getLease(). */
export async function getMeter(meterId: string, organizationId: string): Promise<MeterDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*, utilities(id, name, is_metered), units(id, unit_code, properties(id, name)), properties(id, name)")
    .eq("id", meterId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load meter: ${error.message}`);
  }

  return data;
}

export interface MeterForBatchItem {
  id: string;
  meter_code: string;
  utility_id: string;
  utilities: { name: string } | null;
  units: { unit_code: string } | null;
  latest_reading: { reading_value: number; reading_date: string } | null;
}

/**
 * Every active meter installed at a property — either directly
 * (property-scoped) or on one of its units (unit-scoped) — for the
 * Batch Reading grid. Latest reading is the same per-row batched lookup
 * getMeters() already uses, not a calculation.
 */
export async function getMetersForProperty(propertyId: string, organizationId: string): Promise<MeterForBatchItem[]> {
  const supabase = await createClient();

  const { data: units, error: unitsError } = await supabase.from("units").select("id").eq("property_id", propertyId).eq("organization_id", organizationId);
  if (unitsError) {
    throw new Error(`Failed to load units for property: ${unitsError.message}`);
  }
  const unitIds = (units ?? []).map((unit) => unit.id);

  const scopeFilter = unitIds.length > 0 ? `property_id.eq.${propertyId},unit_id.in.(${unitIds.join(",")})` : `property_id.eq.${propertyId}`;

  const { data, error } = await supabase
    .from("meters")
    .select("id, meter_code, utility_id, utilities(name), units(unit_code)")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .or(scopeFilter)
    .order("meter_code", { ascending: true });

  if (error) {
    throw new Error(`Failed to load meters for property: ${error.message}`);
  }

  const rows = data ?? [];
  const latestReadings = await Promise.all(
    rows.map(async (row) => {
      const { data: reading, error: readingError } = await supabase
        .from("meter_readings")
        .select("reading_value, reading_date")
        .eq("meter_id", row.id)
        .order("reading_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (readingError) {
        throw new Error(`Failed to load latest reading: ${readingError.message}`);
      }
      return reading;
    }),
  );

  return rows.map((row, index) => ({ ...row, latest_reading: latestReadings[index] ?? null }));
}
