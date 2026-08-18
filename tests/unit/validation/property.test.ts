import { describe, expect, it } from "vitest";
import { propertyFormSchema } from "@/lib/validation/property";

const validInput = {
  propertyCode: "SH-01",
  name: "Shanti Nivas",
  propertyTypeId: "",
  description: "",
  status: "ACTIVE",
  addressLine1: "14 Marine Drive",
  addressLine2: "",
  locality: "",
  city: "Kochi",
  state: "Kerala",
  postalCode: "682031",
  countryCode: "in",
  latitude: "",
  longitude: "",
  totalArea: "",
  areaUnit: "",
};

describe("propertyFormSchema", () => {
  it("accepts a minimal valid property and uppercases the country code", () => {
    const result = propertyFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("IN");
      expect(result.data.propertyTypeId).toBeUndefined();
    }
  });

  it("rejects an empty property code", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, propertyCode: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, countryCode: "IND" });
    expect(result.success).toBe(false);
  });

  it("rejects latitude out of range", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, latitude: "999" });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, longitude: "-200" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative total area", () => {
    const result = propertyFormSchema.safeParse({ ...validInput, totalArea: "-5" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid latitude/longitude/area", () => {
    const result = propertyFormSchema.safeParse({
      ...validInput,
      latitude: "9.9312",
      longitude: "76.2673",
      totalArea: "1200",
      areaUnit: "sq_ft",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBe(9.9312);
      expect(result.data.totalArea).toBe(1200);
    }
  });
});
