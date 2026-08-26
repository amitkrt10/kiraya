import { describe, expect, it } from "vitest";
import { tenantUnitAssignmentFormSchema } from "@/lib/validation/tenantUnitAssignment";

const validInput = {
  tenantId: "tenant-1",
  occupancyStartDate: "2026-01-01",
  occupancyNotes: "",
  ruleName: "Base Rent",
  monthlyRent: "20000",
  billingFrequency: "MONTHLY",
  billingDay: "1",
  prorationMethod: "CALENDAR_DAYS",
  dueDaysAfterBill: "0",
  depositRequiredAmount: "",
  depositReference: "",
  depositNotes: "",
};

describe("tenantUnitAssignmentFormSchema", () => {
  it("accepts a minimal valid assignment", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("has no effectiveFrom/effectiveTo fields at all — the system derives the rent rule's period from occupancyStartDate", () => {
    expect("effectiveFrom" in tenantUnitAssignmentFormSchema.shape).toBe(false);
    expect("effectiveTo" in tenantUnitAssignmentFormSchema.shape).toBe(false);
  });

  it("has no first_bill_prorate/final_bill_prorate/bill_in_advance fields — P6.2 found them stored but inert", () => {
    expect("firstBillProrate" in tenantUnitAssignmentFormSchema.shape).toBe(false);
    expect("finalBillProrate" in tenantUnitAssignmentFormSchema.shape).toBe(false);
    expect("billInAdvance" in tenantUnitAssignmentFormSchema.shape).toBe(false);
  });

  it("rejects a missing tenant", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, tenantId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing occupancy start date", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, occupancyStartDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly rent", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, monthlyRent: "-100" });
    expect(result.success).toBe(false);
  });

  it("accepts zero monthly rent", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, monthlyRent: "0" });
    expect(result.success).toBe(true);
  });

  it("requires billingDay when billingFrequency is MONTHLY", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, billingDay: "" });
    expect(result.success).toBe(false);
  });

  it("does not require billingDay for a non-monthly frequency", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, billingFrequency: "YEARLY", billingDay: "" });
    expect(result.success).toBe(true);
  });

  it("deposit fields are entirely optional", () => {
    const result = tenantUnitAssignmentFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depositRequiredAmount).toBeUndefined();
      expect(result.data.depositReference).toBeUndefined();
    }
  });

  it("accepts a deposit amount when provided, and rejects a negative one", () => {
    const withDeposit = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, depositRequiredAmount: "20000" });
    expect(withDeposit.success).toBe(true);
    if (withDeposit.success) {
      expect(withDeposit.data.depositRequiredAmount).toBe(20000);
    }

    const negativeDeposit = tenantUnitAssignmentFormSchema.safeParse({ ...validInput, depositRequiredAmount: "-500" });
    expect(negativeDeposit.success).toBe(false);
  });

  it("rejects due-days-after-bill outside 0-365", () => {
    expect(tenantUnitAssignmentFormSchema.safeParse({ ...validInput, dueDaysAfterBill: "-1" }).success).toBe(false);
    expect(tenantUnitAssignmentFormSchema.safeParse({ ...validInput, dueDaysAfterBill: "400" }).success).toBe(false);
  });
});
