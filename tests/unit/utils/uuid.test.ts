import { describe, expect, it } from "vitest";
import { isUuid } from "@/lib/utils/uuid";

describe("isUuid", () => {
  it("accepts a well-formed UUID", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("rejects malformed route params instead of letting them hit Postgres as a raw uuid comparison", () => {
    expect(isUuid("<a property id that belongs to that organization>")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});
