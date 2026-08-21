import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MeterReadingRow = Database["kiraya"]["Tables"]["meter_readings"]["Row"];
export type BillItemRow = Database["kiraya"]["Tables"]["bill_items"]["Row"];

/** Full reading history for one meter, newest first — backend-ordered, never resorted here. */
export async function getMeterReadings(meterId: string, organizationId: string): Promise<MeterReadingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meter_readings")
    .select("*")
    .eq("meter_id", meterId)
    .eq("organization_id", organizationId)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load meter readings: ${error.message}`);
  }

  return data ?? [];
}

/** The meter's single most recent reading, if any — used as read-only context on the Record Reading form (never a computed value). */
export async function getLatestMeterReading(meterId: string, organizationId: string): Promise<MeterReadingRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meter_readings")
    .select("*")
    .eq("meter_id", meterId)
    .eq("organization_id", organizationId)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load latest reading: ${error.message}`);
  }

  return data;
}

export interface GeneratedUtilityBillItem extends BillItemRow {
  bills: { id: string; bill_number: string; period_start: string; period_end: string } | null;
}

/**
 * Every UTILITY bill_item this meter has ever contributed to, joined to
 * its bill for period/reference — the authoritative "Billing Connection"
 * data source. Consumption/rate/amount are read straight from the
 * already-generated row (kiraya.generate_utility_bill_items()'s own
 * snapshot); nothing here recalculates anything.
 */
export async function getMeterGeneratedBillItems(meterId: string, organizationId: string): Promise<GeneratedUtilityBillItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bill_items")
    .select("*, bills(id, bill_number, period_start, period_end)")
    .eq("meter_id", meterId)
    .eq("organization_id", organizationId)
    .eq("item_type", "UTILITY")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load generated utility charges: ${error.message}`);
  }

  return data ?? [];
}
