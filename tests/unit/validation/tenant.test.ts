import { describe, expect, it } from "vitest";
import { tenantFormSchema } from "@/lib/validation/tenant";

const validInput = {
  tenantCode: "TEN-01",
  displayName: "Asha Rao",
  tenantType: "INDIVIDUAL",
  status: "ACTIVE",
  legalName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  taxIdentifier: "",
  dateOfBirth: "",
  companyRegistrationNumber: "",
  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "in",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
};

describe("tenantFormSchema", () => {
  it("accepts a minimal valid tenant and uppercases the country code", () => {
    const result = tenantFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("IN");
      expect(result.data.phone).toBeUndefined();
    }
  });

  it("rejects an empty tenant code", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, tenantCode: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an empty display name", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, displayName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid tenant type", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, tenantType: "LANDLORD" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid email and blank optional fields as undefined", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, email: "asha@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("asha@example.com");
    }
  });

  it("treats a null field (zero-option select) the same as an empty string", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, phone: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });
});
