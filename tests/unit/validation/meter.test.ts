import { describe, expect, it } from "vitest";
import { meterFormSchema } from "@/lib/validation/meter";

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    utilityId: "utility-1",
    scope: "PROPERTY",
    propertyId: "prop-1",
    unitId: undefined,
    meterCode: "MTR-001",
    meterType: "FIXED",
    serialNumber: undefined,
    unitName: undefined,
    multiplier: undefined,
    installedOn: undefined,
    initialReading: undefined,
    ...overrides,
  };
}

describe("meterFormSchema — property vs unit scope", () => {
  it("accepts a PROPERTY-scoped meter with a propertyId", () => {
    const result = meterFormSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("accepts a UNIT-scoped meter with a unitId", () => {
    const result = meterFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: undefined, unitId: "unit-1" }));
    expect(result.success).toBe(true);
  });

  it("accepts the unrendered opposite-scope field represented as null — the FormData.get() shape for a field not in the form", () => {
    const result = meterFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: null, unitId: "unit-1" }));
    expect(result.success).toBe(true);
  });

  it("rejects a PROPERTY-scoped meter with propertyId null", () => {
    const result = meterFormSchema.safeParse(baseInput({ propertyId: null }));
    expect(result.success).toBe(false);
  });

  it("rejects a UNIT-scoped meter missing a unitId (null)", () => {
    const result = meterFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: null, unitId: null }));
    expect(result.success).toBe(false);
  });

  it("rejects a UNIT-scoped meter missing a unitId (undefined)", () => {
    const result = meterFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: undefined, unitId: undefined }));
    expect(result.success).toBe(false);
  });

  it("treats an empty-string scope identifier as absent, still failing the scope requirement", () => {
    const result = meterFormSchema.safeParse(baseInput({ propertyId: "" }));
    expect(result.success).toBe(false);
  });
});
