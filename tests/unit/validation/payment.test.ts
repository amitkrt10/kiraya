import { describe, expect, it } from "vitest";
import { paymentFormSchema, reversePaymentFormSchema } from "@/lib/validation/payment";

const validInput = {
  tenantId: "tenant-1",
  paymentMethodId: "method-1",
  paymentDate: "2026-01-05",
  amount: "5000",
  referenceNumber: "",
  bankName: "",
  chequeNumber: "",
  transactionReference: "",
  notes: "",
};

describe("paymentFormSchema", () => {
  it("accepts a minimal valid payment", () => {
    const result = paymentFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(5000);
    }
  });

  it("requires a tenant", () => {
    const result = paymentFormSchema.safeParse({ ...validInput, tenantId: "" });
    expect(result.success).toBe(false);
  });

  it("requires a payment method", () => {
    const result = paymentFormSchema.safeParse({ ...validInput, paymentMethodId: "" });
    expect(result.success).toBe(false);
  });

  it("requires a payment date", () => {
    const result = paymentFormSchema.safeParse({ ...validInput, paymentDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = paymentFormSchema.safeParse({ ...validInput, amount: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = paymentFormSchema.safeParse({ ...validInput, amount: "-100" });
    expect(result.success).toBe(false);
  });
});

describe("reversePaymentFormSchema", () => {
  it("accepts a non-empty reason", () => {
    const result = reversePaymentFormSchema.safeParse({ reason: "Recorded against the wrong tenant" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty reason", () => {
    const result = reversePaymentFormSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only reason", () => {
    const result = reversePaymentFormSchema.safeParse({ reason: "   " });
    expect(result.success).toBe(false);
  });
});
