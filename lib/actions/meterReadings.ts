"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseMeterReadingFormData, batchReadingRowSchema } from "@/lib/validation/meterReading";
import { recordMeterReading, createMeterReadingBatch, recordBatchMeterReadings, type BatchReadingRowResult } from "@/lib/mutations/meterReadings";

export interface MeterReadingActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function recordMeterReadingAction(
  meterId: string,
  _prevState: MeterReadingActionState,
  formData: FormData,
): Promise<MeterReadingActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseMeterReadingFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await recordMeterReading(access.organizationId, meterId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/meters/${meterId}`);
  return { success: true };
}

export interface BatchReadingActionState {
  error?: string;
  results?: BatchReadingRowResult[];
  batchCode?: string;
}

/**
 * Creates the meter_reading_batches grouping row, then inserts each row's
 * reading as its own independent statement (recordBatchMeterReadings) —
 * one meter's rejection never affects any other row, matching the
 * approved design and the confirmed absence of an atomic batch RPC.
 */
export async function submitBatchReadingsAction(
  propertyId: string,
  readingDate: string,
  _prevState: BatchReadingActionState,
  formData: FormData,
): Promise<BatchReadingActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const raw = formData.get("rows");
  if (typeof raw !== "string") {
    return { error: "No readings were submitted." };
  }

  let parsedRows: unknown;
  try {
    parsedRows = JSON.parse(raw);
  } catch {
    return { error: "Could not read the submitted readings." };
  }

  const parsed = z.array(batchReadingRowSchema).safeParse(parsedRows);
  if (!parsed.success) {
    return { error: "One or more rows have an invalid reading value." };
  }
  if (parsed.data.length === 0) {
    return { error: "Enter at least one reading before saving." };
  }

  const batch = await createMeterReadingBatch(access.organizationId, propertyId, readingDate);
  if (!batch.data) {
    return { error: batch.error ?? "Could not start the batch." };
  }
  const batchRow = batch.data;

  const results = await recordBatchMeterReadings(access.organizationId, batchRow.id, readingDate, parsed.data);

  revalidatePath("/app/meters/batch");
  return { results, batchCode: batchRow.batch_code };
}
