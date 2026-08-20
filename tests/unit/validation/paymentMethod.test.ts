import { describe, expect, it } from "vitest";
import { paymentMethodFormSchema } from "@/lib/validation/paymentMethod";

const validInput = { code: "CASH", name: "Cash", methodType: "CASH" };

describe("paymentMethodFormSchema", () => {
  it("accepts a minimal valid payment method", () => {
    const result = paymentMethodFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("requires a code", () => {
    const result = paymentMethodFormSchema.safeParse({ ...validInput, code: "" });
    expect(result.success).toBe(false);
  });

  it("requires a name", () => {
    const result = paymentMethodFormSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid method type", () => {
    const result = paymentMethodFormSchema.safeParse({ ...validInput, methodType: "BITCOIN" });
    expect(result.success).toBe(false);
  });
});
