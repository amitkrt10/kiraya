import { describe, expect, it } from "vitest";
import { occupancyFormSchema } from "@/lib/validation/occupancy";

const validInput = {
  occupancyStartDate: "2026-01-01",
  noticeDate: "",
  moveInDate: "",
  moveOutDate: "",
  notes: "",
};

describe("occupancyFormSchema — P6.3-F: the Tenant/Unit-facing occupancy edit, never lease_code/status/currency/tenantId/unitId", () => {
  it("accepts a minimal valid submission", () => {
    expect(occupancyFormSchema.safeParse(validInput).success).toBe(true);
  });

  it("has no lease_code/status/currency/tenantId/unitId fields at all", () => {
    expect("leaseCode" in occupancyFormSchema.shape).toBe(false);
    expect("status" in occupancyFormSchema.shape).toBe(false);
    expect("currencyCode" in occupancyFormSchema.shape).toBe(false);
    expect("tenantId" in occupancyFormSchema.shape).toBe(false);
    expect("unitId" in occupancyFormSchema.shape).toBe(false);
    expect("agreementEndDate" in occupancyFormSchema.shape).toBe(false);
    expect("actualEndDate" in occupancyFormSchema.shape).toBe(false);
  });

  it("requires occupancy start date", () => {
    const result = occupancyFormSchema.safeParse({ ...validInput, occupancyStartDate: "" });
    expect(result.success).toBe(false);
  });

  it("accepts notice/move-in/move-out dates on or after the occupancy start date", () => {
    const result = occupancyFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-01-01",
      noticeDate: "2026-06-01",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-07-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a notice date before the occupancy start date", () => {
    const result = occupancyFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      noticeDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a move-in date before the occupancy start date", () => {
    const result = occupancyFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      moveInDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a move-out date before the occupancy start date", () => {
    const result = occupancyFormSchema.safeParse({
      ...validInput,
      occupancyStartDate: "2026-06-01",
      moveOutDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("leaves notice/move-in/move-out/notes optional", () => {
    const result = occupancyFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.noticeDate).toBeUndefined();
      expect(result.data.moveInDate).toBeUndefined();
      expect(result.data.moveOutDate).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });
});
