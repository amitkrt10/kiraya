import { describe, expect, it } from "vitest";
import { unitFormSchema } from "@/lib/validation/unit";

const validInput = {
  unitCode: "A-101",
  name: "",
  unitTypeId: "",
  description: "",
  status: "VACANT",
  floorNumber: "",
  area: "",
  areaUnit: "",
  bedrooms: "",
  bathrooms: "",
};

describe("unitFormSchema", () => {
  it("accepts a minimal valid unit", () => {
    const result = unitFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects an empty unit code", () => {
    const result = unitFormSchema.safeParse({ ...validInput, unitCode: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative area", () => {
    const result = unitFormSchema.safeParse({ ...validInput, area: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative bedrooms/bathrooms count", () => {
    expect(unitFormSchema.safeParse({ ...validInput, bedrooms: "-1" }).success).toBe(false);
    expect(unitFormSchema.safeParse({ ...validInput, bathrooms: "-1" }).success).toBe(false);
  });

  it("allows fractional bedrooms/bathrooms (numeric(4,1) in the schema)", () => {
    const result = unitFormSchema.safeParse({ ...validInput, bedrooms: "1.5", bathrooms: "2.5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bedrooms).toBe(1.5);
      expect(result.data.bathrooms).toBe(2.5);
    }
  });

  it("rejects a non-integer floor number", () => {
    const result = unitFormSchema.safeParse({ ...validInput, floorNumber: "1.5" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = unitFormSchema.safeParse({ ...validInput, status: "GONE" });
    expect(result.success).toBe(false);
  });
});
