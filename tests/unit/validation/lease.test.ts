import { describe, expect, it } from "vitest";
import { leaseFormSchema } from "@/lib/validation/lease";

const validInput = {
  leaseCode: "LSE-01",
  tenantId: "tenant-1",
  unitId: "unit-1",
  status: "DRAFT",
  agreementStartDate: "2026-01-01",
  agreementEndDate: "2026-12-31",
  occupancyStartDate: "2026-01-01",
  actualEndDate: "",
  noticeDate: "",
  moveInDate: "",
  moveOutDate: "",
  currencyCode: "inr",
  notes: "",
};

describe("leaseFormSchema", () => {
  it("accepts a minimal valid lease and uppercases the currency code", () => {
    const result = leaseFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe("INR");
    }
  });

  it("requires a tenant to be selected", () => {
    const result = leaseFormSchema.safeParse({ ...validInput, tenantId: "" });
    expect(result.success).toBe(false);
  });

  it("requires a unit to be selected", () => {
    const result = leaseFormSchema.safeParse({ ...validInput, unitId: "" });
    expect(result.success).toBe(false);
  });

  it("requires an agreement start date", () => {
    const result = leaseFormSchema.safeParse({ ...validInput, agreementStartDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an agreement end date before the agreement start date", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      agreementStartDate: "2026-06-01",
      agreementEndDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an open-ended lease with no agreement end date", () => {
    const result = leaseFormSchema.safeParse({ ...validInput, agreementEndDate: "" });
    expect(result.success).toBe(true);
  });

  it("rejects occupancy starting before the agreement start date", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      agreementStartDate: "2026-06-01",
      occupancyStartDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an actual end date before occupancy started", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      actualEndDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a move-in date before occupancy started", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      moveInDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a move-out date before occupancy started", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      moveOutDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a notice date before the agreement start date", () => {
    const result = leaseFormSchema.safeParse({
      ...validInput,
      agreementStartDate: "2026-06-01",
      occupancyStartDate: "2026-06-01",
      noticeDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid lease status", () => {
    const result = leaseFormSchema.safeParse({ ...validInput, status: "PENDING" });
    expect(result.success).toBe(false);
  });
});
