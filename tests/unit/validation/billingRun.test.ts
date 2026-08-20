import { describe, expect, it } from "vitest";
import { billingRunFormSchema } from "@/lib/validation/billingRun";

const validInput = {
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  billDate: "2026-01-01",
  dueDate: "",
  propertyId: "",
};

describe("billingRunFormSchema", () => {
  it("accepts a minimal valid organization-wide run", () => {
    const result = billingRunFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.propertyId).toBeUndefined();
    }
  });

  it("requires a period start date", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, periodStart: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a period end before period start", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, periodStart: "2026-06-01", periodEnd: "2026-01-01" });
    expect(result.success).toBe(false);
  });

  it("requires a bill date", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, billDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a due date before the bill date", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, billDate: "2026-06-01", dueDate: "2026-01-01" });
    expect(result.success).toBe(false);
  });

  it("accepts a property-scoped run", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, propertyId: "prop-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.propertyId).toBe("prop-1");
    }
  });

  it("accepts no due date (open-ended)", () => {
    const result = billingRunFormSchema.safeParse({ ...validInput, dueDate: "" });
    expect(result.success).toBe(true);
  });
});
