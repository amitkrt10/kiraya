import { describe, expect, it } from "vitest";
import { parseRecordDepositReceiptFormData, parseRecordDepositDeductionFormData } from "@/lib/validation/securityDeposit";

function makeFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("recordDepositReceiptFormSchema", () => {
  const baseReceiptAgainstExisting = {
    amount: "5000",
    transactionDate: "2026-01-01",
    description: "Deposit received",
  };

  it("accepts a valid receipt against an existing deposit (no requiredAmount/depositReference)", () => {
    const result = parseRecordDepositReceiptFormData(makeFormData(baseReceiptAgainstExisting));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(5000);
      expect(result.data.requiredAmount).toBeUndefined();
    }
  });

  it("accepts a valid receipt that also creates the deposit (requiredAmount + depositReference present)", () => {
    const result = parseRecordDepositReceiptFormData(
      makeFormData({ ...baseReceiptAgainstExisting, requiredAmount: "50000", depositReference: "DEP-001" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requiredAmount).toBe(50000);
      expect(result.data.depositReference).toBe("DEP-001");
    }
  });

  it("rejects a zero amount", () => {
    const result = parseRecordDepositReceiptFormData(makeFormData({ ...baseReceiptAgainstExisting, amount: "0" }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = parseRecordDepositReceiptFormData(makeFormData({ ...baseReceiptAgainstExisting, amount: "-100" }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative requiredAmount", () => {
    const result = parseRecordDepositReceiptFormData(
      makeFormData({ ...baseReceiptAgainstExisting, requiredAmount: "-1" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a zero requiredAmount", () => {
    const result = parseRecordDepositReceiptFormData(
      makeFormData({ ...baseReceiptAgainstExisting, requiredAmount: "0" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a missing transaction date", () => {
    const result = parseRecordDepositReceiptFormData(makeFormData({ amount: "5000", description: "Deposit received" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing description", () => {
    const result = parseRecordDepositReceiptFormData(makeFormData({ amount: "5000", transactionDate: "2026-01-01" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric amount", () => {
    const result = parseRecordDepositReceiptFormData(
      makeFormData({ ...baseReceiptAgainstExisting, amount: "not-a-number" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("recordDepositDeductionFormSchema", () => {
  const baseDeduction = {
    amount: "1000",
    transactionDate: "2026-02-01",
    description: "Cleaning charge",
  };

  it("accepts a valid deduction", () => {
    const result = parseRecordDepositDeductionFormData(makeFormData(baseDeduction));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1000);
    }
  });

  it("rejects a zero amount", () => {
    const result = parseRecordDepositDeductionFormData(makeFormData({ ...baseDeduction, amount: "0" }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = parseRecordDepositDeductionFormData(makeFormData({ ...baseDeduction, amount: "-500" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing reason/description", () => {
    const result = parseRecordDepositDeductionFormData(makeFormData({ amount: "1000", transactionDate: "2026-02-01" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing deduction date", () => {
    const result = parseRecordDepositDeductionFormData(makeFormData({ amount: "1000", description: "Cleaning charge" }));
    expect(result.success).toBe(false);
  });
});
