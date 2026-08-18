import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/utils/initials";

describe("getInitials", () => {
  it("builds initials from the first two words", () => {
    expect(getInitials("Deepa Nair")).toBe("DN");
  });

  it("uses a single letter for a one-word name", () => {
    expect(getInitials("Cher")).toBe("C");
  });

  it("falls back for empty/missing names", () => {
    expect(getInitials(null)).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
