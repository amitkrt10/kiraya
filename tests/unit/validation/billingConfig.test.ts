import { describe, expect, it } from "vitest";
import { billingConfigFormSchema } from "@/lib/validation/billingConfig";

const validInput = {
  billingFrequency: "MONTHLY",
  billingDay: "1",
  billingAnchorMonth: "",
  prorationMethod: "CALENDAR_DAYS",
  firstBillProrate: "on",
  finalBillProrate: "on",
  billInAdvance: "",
  dueDaysAfterBill: "0",
  effectiveFrom: "2026-01-01",
  effectiveTo: "",
  notes: "",
};

describe("billingConfigFormSchema", () => {
  it("accepts a minimal valid monthly billing configuration", () => {
    const result = billingConfigFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.billingDay).toBe(1);
      expect(result.data.firstBillProrate).toBe(true);
      expect(result.data.billInAdvance).toBe(false);
    }
  });

  it("requires a billing day when frequency is MONTHLY", () => {
    const result = billingConfigFormSchema.safeParse({ ...validInput, billingDay: "" });
    expect(result.success).toBe(false);
  });

  it("does not require a billing day for a non-monthly frequency", () => {
    const result = billingConfigFormSchema.safeParse({
      ...validInput,
      billingFrequency: "YEARLY",
      billingDay: "",
    });
    expect(result.success).toBe(true);
  });

  it("treats an absent checkbox field as false, never a form-specific default", () => {
    const { firstBillProrate: _omit, ...withoutCheckbox } = validInput;
    const result = billingConfigFormSchema.safeParse(withoutCheckbox);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstBillProrate).toBe(false);
    }
  });

  it("rejects a billing day out of the 1-31 range", () => {
    const result = billingConfigFormSchema.safeParse({ ...validInput, billingDay: "32" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid proration method", () => {
    const result = billingConfigFormSchema.safeParse({ ...validInput, prorationMethod: "MADE_UP" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative due-days-after-bill", () => {
    const result = billingConfigFormSchema.safeParse({ ...validInput, dueDaysAfterBill: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects an effective-to date before effective-from", () => {
    const result = billingConfigFormSchema.safeParse({
      ...validInput,
      effectiveFrom: "2026-06-01",
      effectiveTo: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("requires an effective-from date", () => {
    const result = billingConfigFormSchema.safeParse({ ...validInput, effectiveFrom: "" });
    expect(result.success).toBe(false);
  });
});
