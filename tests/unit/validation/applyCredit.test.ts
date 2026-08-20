import { describe, expect, it } from "vitest";
import { parseApplyCreditFormData } from "@/lib/validation/applyCredit";

function makeFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("applyCreditFormSchema", () => {
  it("accepts a positive amount", () => {
    const result = parseApplyCreditFormData(makeFormData({ amount: "3000" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(3000);
    }
  });

  it("accepts a positive decimal amount", () => {
    const result = parseApplyCreditFormData(makeFormData({ amount: "1500.50" }));
    expect(result.success).toBe(true);
  });

  it("rejects zero", () => {
    const result = parseApplyCreditFormData(makeFormData({ amount: "0" }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = parseApplyCreditFormData(makeFormData({ amount: "-500" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric amount", () => {
    const result = parseApplyCreditFormData(makeFormData({ amount: "not-a-number" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing amount", () => {
    const result = parseApplyCreditFormData(makeFormData({}));
    expect(result.success).toBe(false);
  });
});
