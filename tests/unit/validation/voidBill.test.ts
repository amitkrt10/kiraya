import { describe, expect, it } from "vitest";
import { voidBillFormSchema } from "@/lib/validation/voidBill";

describe("voidBillFormSchema", () => {
  it("accepts a non-empty reason", () => {
    const result = voidBillFormSchema.safeParse({ reason: "Billed the wrong tenant" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty reason", () => {
    const result = voidBillFormSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only reason", () => {
    const result = voidBillFormSchema.safeParse({ reason: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a reason over 500 characters", () => {
    const result = voidBillFormSchema.safeParse({ reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});
