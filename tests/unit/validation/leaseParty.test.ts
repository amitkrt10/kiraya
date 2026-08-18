import { describe, expect, it } from "vitest";
import { leasePartyFormSchema } from "@/lib/validation/leaseParty";

describe("leasePartyFormSchema", () => {
  it("accepts a party with an existing tenant and no display name", () => {
    const result = leasePartyFormSchema.safeParse({
      partyRole: "CO_TENANT",
      tenantId: "tenant-1",
      displayName: "",
      phone: "",
      email: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a party with just a display name and no tenant record", () => {
    const result = leasePartyFormSchema.safeParse({
      partyRole: "GUARANTOR",
      tenantId: "",
      displayName: "Ravi Kumar",
      phone: "",
      email: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a party with neither a tenant nor a display name", () => {
    const result = leasePartyFormSchema.safeParse({
      partyRole: "OCCUPANT",
      tenantId: "",
      displayName: "",
      phone: "",
      email: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid party role", () => {
    const result = leasePartyFormSchema.safeParse({
      partyRole: "LANDLORD",
      tenantId: "tenant-1",
      displayName: "",
      phone: "",
      email: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = leasePartyFormSchema.safeParse({
      partyRole: "OTHER",
      tenantId: "tenant-1",
      displayName: "",
      phone: "",
      email: "not-an-email",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});
