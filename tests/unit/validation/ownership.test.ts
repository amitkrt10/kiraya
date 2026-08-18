import { describe, expect, it } from "vitest";
import { ownershipFormSchema } from "@/lib/validation/ownership";

const validInput = {
  ownerId: "11111111-1111-1111-1111-111111111111",
  ownershipPercentage: "60",
  ownershipStartDate: "",
  ownershipEndDate: "",
  notes: "",
};

describe("ownershipFormSchema", () => {
  it("accepts a valid ownership record", () => {
    const result = ownershipFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("requires an owner to be selected", () => {
    const result = ownershipFormSchema.safeParse({ ...validInput, ownerId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a percentage of 0 (must be greater than 0)", () => {
    const result = ownershipFormSchema.safeParse({ ...validInput, ownershipPercentage: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a percentage above 100", () => {
    const result = ownershipFormSchema.safeParse({ ...validInput, ownershipPercentage: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = ownershipFormSchema.safeParse({
      ...validInput,
      ownershipStartDate: "2026-06-01",
      ownershipEndDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an end date on or after the start date", () => {
    const result = ownershipFormSchema.safeParse({
      ...validInput,
      ownershipStartDate: "2026-01-01",
      ownershipEndDate: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });
});
