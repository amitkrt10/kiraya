import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MeterReadingFormValues } from "@/lib/validation/meterReading";
import type { MeterReadingRow } from "@/lib/queries/meterReadings";
import { translateDatabaseError, type MutationResult } from "./errors";

export async function recordMeterReading(
  organizationId: string,
  meterId: string,
  values: MeterReadingFormValues,
): Promise<MutationResult<MeterReadingRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meter_readings")
    .insert({
      organization_id: organizationId,
      meter_id: meterId,
      reading_date: values.readingDate,
      reading_value: values.readingValue,
      reading_event_type: values.readingEventType,
      reading_source: values.readingSource,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

export interface MeterReadingBatchRow {
  id: string;
  organization_id: string;
  property_id: string | null;
  reading_date: string;
  batch_code: string;
  status: string;
}

/**
 * Plain grouping-record creation — kiraya.meter_reading_batches has no
 * supporting function of any kind (confirmed in the P5.5A/P5.5C
 * investigations: no RPC creates it, transitions its status, or ties
 * readings to it authoritatively). This is a label to group the
 * upcoming individual reading inserts under, nothing more — status
 * always stays 'DRAFT' and is never changed by this application.
 */
export async function createMeterReadingBatch(
  organizationId: string,
  propertyId: string,
  readingDate: string,
): Promise<MutationResult<MeterReadingBatchRow>> {
  const supabase = await createClient();
  const batchCode = `BATCH-${readingDate}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data, error } = await supabase
    .from("meter_reading_batches")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      reading_date: readingDate,
      batch_code: batchCode,
    })
    .select("id, organization_id, property_id, reading_date, batch_code, status")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

export interface BatchReadingRowResult {
  meterId: string;
  status: "saved" | "error";
  error?: string;
}

/**
 * Records each row's reading as its OWN independent insert — deliberately
 * NOT wrapped in a single transaction, matching the approved design and
 * the confirmed absence of any atomic batch-submission mechanism in the
 * database. One meter's failure (a validation rejection from
 * kiraya.validate_meter_reading(), an organization mismatch, etc.) never
 * blocks or rolls back any other row's already-saved reading.
 */
export async function recordBatchMeterReadings(
  organizationId: string,
  batchId: string,
  readingDate: string,
  rows: { meterId: string; readingValue: number }[],
): Promise<BatchReadingRowResult[]> {
  const supabase = await createClient();
  const results: BatchReadingRowResult[] = [];

  for (const row of rows) {
    const { error } = await supabase.from("meter_readings").insert({
      organization_id: organizationId,
      meter_id: row.meterId,
      reading_batch_id: batchId,
      reading_date: readingDate,
      reading_value: row.readingValue,
    });

    results.push(error ? { meterId: row.meterId, status: "error", error: translateDatabaseError(error) } : { meterId: row.meterId, status: "saved" });
  }

  return results;
}
