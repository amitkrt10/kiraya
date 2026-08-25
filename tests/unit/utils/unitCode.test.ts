import { describe, expect, it } from "vitest";
import { deriveUnitCodePrefix, formatUnitCode, parseUnitCodeSuffix } from "@/lib/utils/unitCode";

describe("deriveUnitCodePrefix", () => {
  it("takes initials of the first two words of a two-word property name", () => {
    expect(deriveUnitCodePrefix("Kumar Building")).toBe("KB");
    expect(deriveUnitCodePrefix("Sunrise Residency")).toBe("SR");
  });

  it("takes initials of up to the first three words of a multi-word property name", () => {
    expect(deriveUnitCodePrefix("Green Valley Apartments")).toBe("GVA");
  });

  it("ignores extra words past the third", () => {
    expect(deriveUnitCodePrefix("Green Valley Apartments Phase Two")).toBe("GVA");
  });

  it("falls back to the first 3 letters for a single-word property name", () => {
    expect(deriveUnitCodePrefix("Warehouse")).toBe("WAR");
    expect(deriveUnitCodePrefix("Ex")).toBe("EX");
  });

  it("strips punctuation and treats it as a word boundary", () => {
    expect(deriveUnitCodePrefix("O'Neil & Co. Tower")).toBe("ONC");
  });

  it("drops non-ASCII characters entirely (an embedded accent acts as a word boundary, same as any other stripped punctuation)", () => {
    // "é" is itself non-alphanumeric, so it splits "Café" into the single
    // word "Caf" — falls back to the single-word first-3-letters rule.
    expect(deriveUnitCodePrefix("Café")).toBe("CAF");
    // Two clean words separated by a non-ASCII character in between still
    // produce two initials.
    expect(deriveUnitCodePrefix("Green大Valley")).toBe("GV");
  });

  it("falls back to UNT when no ASCII letters or digits remain", () => {
    expect(deriveUnitCodePrefix("北京")).toBe("UNT");
    expect(deriveUnitCodePrefix("   ")).toBe("UNT");
    expect(deriveUnitCodePrefix("")).toBe("UNT");
  });
});

describe("formatUnitCode / parseUnitCodeSuffix — reused from propertyCode.ts", () => {
  it("formats a prefix and sequence the same way as property codes", () => {
    expect(formatUnitCode("KB", 1)).toBe("KB-001");
    expect(formatUnitCode("KB", 42)).toBe("KB-042");
  });

  it("parses the numeric suffix for a matching prefix, case-insensitively", () => {
    expect(parseUnitCodeSuffix("KB-007", "KB")).toBe(7);
    expect(parseUnitCodeSuffix("kb-007", "KB")).toBe(7);
  });

  it("ignores existing/legacy unit codes that don't match the generated shape", () => {
    expect(parseUnitCodeSuffix("P54D-S1-1787290253224", "KB")).toBeNull();
    expect(parseUnitCodeSuffix("KB001", "KB")).toBeNull();
  });
});
