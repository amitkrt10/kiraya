import { describe, expect, it } from "vitest";
import { derivePropertyCodePrefix, formatPropertyCode, parsePropertyCodeSuffix } from "@/lib/utils/propertyCode";

describe("derivePropertyCodePrefix", () => {
  it("takes the first 3 letters of a single-word name", () => {
    expect(derivePropertyCodePrefix("Kiraya")).toBe("KIR");
  });

  it("strips the space and takes the first 3 characters for a two-word name", () => {
    expect(derivePropertyCodePrefix("ABC Realty")).toBe("ABC");
  });

  it("strips punctuation, numbers stay, and result is uppercase", () => {
    expect(derivePropertyCodePrefix("O'Neil & Co.")).toBe("ONE");
  });

  it("keeps digits (safe for names containing numbers)", () => {
    expect(derivePropertyCodePrefix("123 Realty")).toBe("123");
  });

  it("drops non-ASCII characters entirely", () => {
    expect(derivePropertyCodePrefix("Café Realty")).toBe("CAF");
  });

  it("uses fewer than 3 characters when the name has less", () => {
    expect(derivePropertyCodePrefix("Ex")).toBe("EX");
    expect(derivePropertyCodePrefix("X")).toBe("X");
  });

  it("falls back to ORG when no ASCII letters or digits remain", () => {
    expect(derivePropertyCodePrefix("北京")).toBe("ORG");
    expect(derivePropertyCodePrefix("   ")).toBe("ORG");
    expect(derivePropertyCodePrefix("")).toBe("ORG");
  });
});

describe("formatPropertyCode", () => {
  it("zero-pads the sequence to 3 digits", () => {
    expect(formatPropertyCode("RNT", 1)).toBe("RNT-001");
    expect(formatPropertyCode("RNT", 42)).toBe("RNT-042");
  });

  it("does not truncate a sequence that has grown past 3 digits", () => {
    expect(formatPropertyCode("RNT", 1000)).toBe("RNT-1000");
  });
});

describe("parsePropertyCodeSuffix", () => {
  it("extracts the numeric suffix for a matching prefix, case-insensitively", () => {
    expect(parsePropertyCodeSuffix("RNT-007", "RNT")).toBe(7);
    expect(parsePropertyCodeSuffix("rnt-007", "RNT")).toBe(7);
  });

  it("ignores existing/legacy codes that don't match the generated shape", () => {
    expect(parsePropertyCodeSuffix("E2E-PROP-A", "RNT")).toBeNull();
    expect(parsePropertyCodeSuffix("RNT-HQ", "RNT")).toBeNull();
    expect(parsePropertyCodeSuffix("P001", "RNT")).toBeNull();
  });

  it("does not match a different organization's prefix", () => {
    expect(parsePropertyCodeSuffix("ABC-001", "RNT")).toBeNull();
  });
});
