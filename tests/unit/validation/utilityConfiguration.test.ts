import { describe, expect, it } from "vitest";
import { utilityConfigurationFormSchema } from "@/lib/validation/utilityConfiguration";

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    scope: "PROPERTY",
    propertyId: "prop-1",
    unitId: undefined,
    meterType: "FIXED",
    fixedAmount: 500,
    effectiveFrom: "2026-01-01",
    effectiveTo: undefined,
    isTenantChargeable: true,
    isActive: true,
    ...overrides,
  };
}

describe("utilityConfigurationFormSchema — property vs unit scope", () => {
  it("accepts a PROPERTY-scoped configuration with a propertyId", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("rejects a PROPERTY-scoped configuration missing a propertyId", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ propertyId: undefined }));
    expect(result.success).toBe(false);
  });

  it("accepts a UNIT-scoped configuration with a unitId", () => {
    const result = utilityConfigurationFormSchema.safeParse(
      baseInput({ scope: "UNIT", propertyId: undefined, unitId: "unit-1" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a UNIT-scoped configuration missing a unitId", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: undefined, unitId: undefined }));
    expect(result.success).toBe(false);
  });

  it("requires a fixed amount when the charging method is FIXED", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ fixedAmount: undefined }));
    expect(result.success).toBe(false);
  });

  it("does not require a fixed amount for a metered charging method", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ meterType: "SUB_METER", fixedAmount: undefined }));
    expect(result.success).toBe(true);
  });

  it("rejects an effective_to before effective_from", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ effectiveTo: "2025-01-01" }));
    expect(result.success).toBe(false);
  });

  it("accepts an open-ended configuration (no effective_to)", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ effectiveTo: undefined }));
    expect(result.success).toBe(true);
  });

  it("rejects a PROPERTY-scoped configuration with propertyId null — the FormData.get() shape for an unrendered field", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ propertyId: null }));
    expect(result.success).toBe(false);
  });

  it("accepts a UNIT-scoped configuration with the unrendered propertyId represented as null", () => {
    const result = utilityConfigurationFormSchema.safeParse(
      baseInput({ scope: "UNIT", propertyId: null, unitId: "unit-1" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a UNIT-scoped configuration with unitId null", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ scope: "UNIT", propertyId: null, unitId: null }));
    expect(result.success).toBe(false);
  });

  it("treats an empty-string propertyId as absent, still failing the PROPERTY-scope requirement", () => {
    const result = utilityConfigurationFormSchema.safeParse(baseInput({ propertyId: "" }));
    expect(result.success).toBe(false);
  });
});
