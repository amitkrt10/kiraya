import { describe, expect, it } from "vitest";
import { z } from "zod";
import { optionalTrimmedString } from "@/lib/validation/shared";

describe("optionalTrimmedString", () => {
  const schema = z.object({ field: optionalTrimmedString() });

  it("treats an empty string as absent", () => {
    const result = schema.safeParse({ field: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.field).toBeUndefined();
  });

  it("treats null as absent — the exact FormData shape a <select> with zero selectable options submits", () => {
    const result = schema.safeParse({ field: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.field).toBeUndefined();
  });

  it("treats undefined as absent", () => {
    const result = schema.safeParse({ field: undefined });
    expect(result.success).toBe(true);
  });

  it("still validates a real value", () => {
    const result = schema.safeParse({ field: "  Residential  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.field).toBe("Residential");
  });
});
