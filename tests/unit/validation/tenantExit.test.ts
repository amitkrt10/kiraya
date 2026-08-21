import { describe, expect, it } from "vitest";
import {
  parseInitiateTenantExitFormData,
  parseAddSettlementAdjustmentFormData,
  parseCreateDepositRefundFormData,
} from "@/lib/validation/tenantExit";

function makeFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("initiateTenantExitFormSchema", () => {
  it("accepts all fields empty — every field is optional", () => {
    const result = parseInitiateTenantExitFormData(makeFormData({}));
    expect(result.success).toBe(true);
  });

  it("accepts a full set of valid dates and a reason", () => {
    const result = parseInitiateTenantExitFormData(
      makeFormData({ noticeDate: "2026-01-15", plannedExitDate: "2026-03-15", handoverDate: "2026-03-20", reason: "Relocating" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plannedExitDate).toBe("2026-03-15");
    }
  });

  it("rejects an invalid date", () => {
    const result = parseInitiateTenantExitFormData(makeFormData({ plannedExitDate: "not-a-date" }));
    expect(result.success).toBe(false);
  });
});

describe("addSettlementAdjustmentFormSchema", () => {
  const base = { itemType: "CLEANING", description: "Deep cleaning", amount: "3500" };

  it("accepts a valid charge item", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData(base));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(3500);
    }
  });

  it("accepts every allowed charge type", () => {
    for (const itemType of ["FINAL_RENT", "ELECTRICITY", "WATER", "MAINTENANCE", "DAMAGE", "CLEANING", "OTHER"]) {
      const result = parseAddSettlementAdjustmentFormData(makeFormData({ ...base, itemType }));
      expect(result.success).toBe(true);
    }
  });

  it("rejects PREVIOUS_DUE — a reserved, non-creatable item_type", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData({ ...base, itemType: "PREVIOUS_DUE" }));
    expect(result.success).toBe(false);
  });

  it("rejects DEPOSIT_DEDUCTION — out of scope for this wizard round", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData({ ...base, itemType: "DEPOSIT_DEDUCTION" }));
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData({ ...base, amount: "0" }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData({ ...base, amount: "-100" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing description", () => {
    const result = parseAddSettlementAdjustmentFormData(makeFormData({ itemType: "CLEANING", amount: "3500" }));
    expect(result.success).toBe(false);
  });

  it("has no is_credit field at all — the schema cannot express a credit adjustment", () => {
    const shape = Object.keys(parseAddSettlementAdjustmentFormData(makeFormData(base)));
    expect(shape).not.toContain("isCredit");
    expect(shape).not.toContain("is_credit");
  });
});

describe("createDepositRefundFormSchema", () => {
  it("accepts all fields empty — every field is optional (amount is never a field at all)", () => {
    const result = parseCreateDepositRefundFormData(makeFormData({}));
    expect(result.success).toBe(true);
    if (result.success) {
      expect("amount" in result.data).toBe(false);
    }
  });

  it("accepts a full set of valid fields", () => {
    const result = parseCreateDepositRefundFormData(
      makeFormData({ refundDate: "2026-03-15", paymentMethodId: "pm-1", transactionReference: "TXN-001", notes: "Bank transfer" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid refund date", () => {
    const result = parseCreateDepositRefundFormData(makeFormData({ refundDate: "not-a-date" }));
    expect(result.success).toBe(false);
  });
});
