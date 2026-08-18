import { describe, expect, it } from "vitest";
import { rentRuleFormSchema } from "@/lib/validation/rentRule";

const validInput = {
  ruleName: "Base Rent",
  monthlyRent: "25000",
  effectiveFrom: "2026-01-01",
  effectiveTo: "",
  notes: "",
};

describe("rentRuleFormSchema", () => {
  it("accepts a minimal valid rent rule and coerces the amount to a number", () => {
    const result = rentRuleFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyRent).toBe(25000);
    }
  });

  it("requires a rule name", () => {
    const result = rentRuleFormSchema.safeParse({ ...validInput, ruleName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative monthly rent", () => {
    const result = rentRuleFormSchema.safeParse({ ...validInput, monthlyRent: "-100" });
    expect(result.success).toBe(false);
  });

  it("requires an effective-from date", () => {
    const result = rentRuleFormSchema.safeParse({ ...validInput, effectiveFrom: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an effective-to date before effective-from", () => {
    const result = rentRuleFormSchema.safeParse({
      ...validInput,
      effectiveFrom: "2026-06-01",
      effectiveTo: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an open-ended rent rule with no effective-to date", () => {
    const result = rentRuleFormSchema.safeParse({ ...validInput, effectiveTo: "" });
    expect(result.success).toBe(true);
  });

  it("does not expose an auto_apply field even if supplied", () => {
    const result = rentRuleFormSchema.safeParse({ ...validInput, autoApply: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("autoApply");
    }
  });
});
