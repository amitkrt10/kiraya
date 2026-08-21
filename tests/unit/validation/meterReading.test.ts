import { describe, expect, it } from "vitest";
import { meterReadingFormSchema, batchReadingRowSchema } from "@/lib/validation/meterReading";

describe("meterReadingFormSchema", () => {
  it("accepts a valid normal reading", () => {
    const result = meterReadingFormSchema.safeParse({
      readingDate: "2026-06-30",
      readingValue: 190,
      readingEventType: "NORMAL",
      readingSource: "MANUAL",
      notes: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative reading value", () => {
    const result = meterReadingFormSchema.safeParse({
      readingDate: "2026-06-30",
      readingValue: -5,
      readingEventType: "NORMAL",
      readingSource: "MANUAL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing reading date", () => {
    const result = meterReadingFormSchema.safeParse({
      readingDate: "",
      readingValue: 100,
      readingEventType: "NORMAL",
      readingSource: "MANUAL",
    });
    expect(result.success).toBe(false);
  });

  it("defaults event type to NORMAL and source to MANUAL when omitted", () => {
    const result = meterReadingFormSchema.safeParse({ readingDate: "2026-06-30", readingValue: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.readingEventType).toBe("NORMAL");
      expect(result.data.readingSource).toBe("MANUAL");
    }
  });

  it("accepts a lower reading value when the event type is METER_RESET (client-side UX only — the database trigger is the actual authority)", () => {
    const result = meterReadingFormSchema.safeParse({
      readingDate: "2026-06-30",
      readingValue: 0,
      readingEventType: "METER_RESET",
      readingSource: "MANUAL",
    });
    expect(result.success).toBe(true);
  });
});

describe("batchReadingRowSchema — per-row batch validation", () => {
  it("accepts a valid row", () => {
    const result = batchReadingRowSchema.safeParse({ meterId: "meter-1", readingValue: 42 });
    expect(result.success).toBe(true);
  });

  it("rejects a row with a negative reading value", () => {
    const result = batchReadingRowSchema.safeParse({ meterId: "meter-1", readingValue: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects a row with no meterId", () => {
    const result = batchReadingRowSchema.safeParse({ meterId: "", readingValue: 42 });
    expect(result.success).toBe(false);
  });
});
