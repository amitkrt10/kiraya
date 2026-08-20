import { describe, expect, it } from "vitest";
import { csvEscapeField, toCsv } from "@/lib/utils/csv";

describe("csvEscapeField", () => {
  it("leaves a plain value unquoted", () => {
    expect(csvEscapeField("Bill INV-2201")).toBe("Bill INV-2201");
  });

  it("quotes a value containing a comma", () => {
    expect(csvEscapeField("Rent, January")).toBe('"Rent, January"');
  });

  it("quotes a value containing a newline", () => {
    expect(csvEscapeField("Line one\nLine two")).toBe('"Line one\nLine two"');
  });

  it("quotes a value containing a carriage return", () => {
    expect(csvEscapeField("Line one\rLine two")).toBe('"Line one\rLine two"');
  });

  it("quotes and doubles internal quotes", () => {
    expect(csvEscapeField('Tenant "Smith" Co')).toBe('"Tenant ""Smith"" Co"');
  });

  it("leaves an empty string unquoted", () => {
    expect(csvEscapeField("")).toBe("");
  });
});

describe("toCsv", () => {
  it("produces a header row followed by data rows, CRLF-joined", () => {
    const csv = toCsv(["Date", "Amount"], [["2026-01-01", "20000"]]);
    expect(csv).toBe("Date,Amount\r\n2026-01-01,20000\r\n");
  });

  it("preserves a deterministic column order matching the input", () => {
    const csv = toCsv(["Date", "Description", "Debit", "Credit", "Running Balance"], [["2026-01-01", "Bill", "20000", "", "20000"]]);
    const [header] = csv.split("\r\n");
    expect(header).toBe("Date,Description,Debit,Credit,Running Balance");
  });

  it("escapes every field independently, not just the first", () => {
    const csv = toCsv(["A", "B"], [["plain", "has,a,comma"]]);
    expect(csv).toContain('plain,"has,a,comma"');
  });

  it("handles multiple rows in order", () => {
    const csv = toCsv(["Date"], [["2026-01-01"], ["2026-01-02"]]);
    expect(csv).toBe("Date\r\n2026-01-01\r\n2026-01-02\r\n");
  });
});
