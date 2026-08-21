import { z } from "zod";
import { optionalTrimmedString, requiredIsoDate } from "./shared";

/** Mirrors kiraya.reading_event_type. */
export const READING_EVENT_TYPES = ["NORMAL", "METER_RESET", "METER_REPLACEMENT"] as const;
/** Mirrors kiraya.reading_source. */
export const READING_SOURCES = ["MANUAL", "IMPORT", "API"] as const;

export const meterReadingFormSchema = z.object({
  readingDate: requiredIsoDate("Reading date"),
  readingValue: z.coerce.number().gte(0, { error: "Enter a reading of 0 or more." }),
  readingEventType: z.enum(READING_EVENT_TYPES).default("NORMAL"),
  readingSource: z.enum(READING_SOURCES).default("MANUAL"),
  notes: optionalTrimmedString(500),
});

export type MeterReadingFormValues = z.infer<typeof meterReadingFormSchema>;

export function parseMeterReadingFormData(formData: FormData) {
  return meterReadingFormSchema.safeParse({
    readingDate: formData.get("readingDate"),
    readingValue: formData.get("readingValue"),
    readingEventType: formData.get("readingEventType") || "NORMAL",
    readingSource: formData.get("readingSource") || "MANUAL",
    notes: formData.get("notes"),
  });
}

/** One row of a batch reading grid — meterId + an optional value (blank rows are skipped, not errors, matching "Missing" in the approved design rather than a hard validation failure). */
export const batchReadingRowSchema = z.object({
  meterId: z.string().trim().min(1),
  readingValue: z.coerce.number().gte(0, { error: "Enter a reading of 0 or more." }),
});

export type BatchReadingRowValues = z.infer<typeof batchReadingRowSchema>;
