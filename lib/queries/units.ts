import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deriveUnitCodePrefix, formatUnitCode, parseUnitCodeSuffix } from "@/lib/utils/unitCode";
import type { Database } from "@/types/database";

export type UnitStatus = Database["kiraya"]["Enums"]["unit_status"];
export type UnitRow = Database["kiraya"]["Tables"]["units"]["Row"];

export interface UnitListItem extends UnitRow {
  unit_types: { name: string } | null;
}

/** Units belonging to one property — scoped to the organization for the same not-found-vs-leak reasons as getProperty(). */
export async function getPropertyUnits(
  propertyId: string,
  organizationId: string,
): Promise<UnitListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, unit_types(name)")
    .eq("property_id", propertyId)
    .eq("organization_id", organizationId)
    .order("unit_code", { ascending: true });

  if (error) {
    throw new Error(`Failed to load units: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Best-effort, non-authoritative preview for the Add Unit form's Unit
 * Code field — NOT a reservation. It's the highest existing `PREFIX-NNN`
 * code for this property, plus one; the field stays editable, and the
 * existing units_property_code_unique_idx unique index (surfaced as a
 * friendly message by translateDatabaseError on conflict) is what
 * actually guarantees no two units in a property ever end up with the
 * same code, including under concurrent submissions — same architecture
 * as getSuggestedPropertyCode() in lib/queries/properties.ts (P6.1-B).
 *
 * Scoped by propertyId alone (no separate organizationId check): unlike
 * getPropertyUnits(), this is a preview, not the authoritative unit list,
 * and RLS already prevents selecting another organization's units
 * regardless of which property_id is passed in.
 *
 * Deliberately swallows a query failure and falls back to `${prefix}-001`
 * rather than throwing, for the same reason as getSuggestedPropertyCode():
 * this is UX sugar for prefilling one field, not data the page depends on
 * to render.
 */
export async function getSuggestedUnitCode(propertyId: string, propertyName: string): Promise<string> {
  const prefix = deriveUnitCodePrefix(propertyName);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("unit_code")
    .eq("property_id", propertyId)
    .ilike("unit_code", `${prefix}-%`);

  if (error) {
    return formatUnitCode(prefix, 1);
  }

  const highest = (data ?? []).reduce((max, row) => {
    const suffix = parseUnitCodeSuffix(row.unit_code, prefix);
    return suffix !== null && suffix > max ? suffix : max;
  }, 0);

  return formatUnitCode(prefix, highest + 1);
}

export interface UnitPickerItem {
  id: string;
  unit_code: string;
  property_id: string;
}

/**
 * Lightweight, org-wide unit list (id/code/property_id only) for the
 * lease-create form's cascading Property → Unit picker — fetched once and
 * filtered client-side by property, rather than a round-trip per property
 * selection.
 */
export async function getUnitsForPicker(organizationId: string): Promise<UnitPickerItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, unit_code, property_id")
    .eq("organization_id", organizationId)
    .order("unit_code", { ascending: true });

  if (error) {
    throw new Error(`Failed to load units: ${error.message}`);
  }

  return data ?? [];
}

export interface UnitDetail extends UnitRow {
  unit_types: { id: string; name: string } | null;
  properties: { id: string; name: string; property_code: string } | null;
}

/**
 * The one authoritative check for whether a unit can currently be
 * assigned a tenant (kiraya.unit_is_assignable(), P6.3-B) — never
 * units.status = 'VACANT', which P6.3-A found badly desynced from real
 * occupancy. This is a UI convenience only: the RPC that actually performs
 * an assignment re-derives the same fact itself before writing anything,
 * and leases_unit_active_unique_idx is what actually prevents two
 * concurrent assignments to the same unit from both succeeding — a stale
 * `true` read here can never cause a bad write, only a slightly-late
 * "sorry, that's not available anymore" message.
 */
export async function isUnitAssignable(unitId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unit_is_assignable", { p_unit_id: unitId });

  if (error) {
    throw new Error(`Failed to check unit assignability: ${error.message}`);
  }

  return data ?? false;
}

export async function getUnit(unitId: string, organizationId: string): Promise<UnitDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, unit_types(id, name), properties(id, name, property_code)")
    .eq("id", unitId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    // See getProperty() — an invalid uuid should read as not-found.
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load unit: ${error.message}`);
  }

  return data;
}
