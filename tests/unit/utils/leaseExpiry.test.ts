import { describe, expect, it } from "vitest";
import { isLeaseExpiringSoon } from "@/lib/utils/leaseExpiry";

function daysFromToday(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("isLeaseExpiringSoon", () => {
  it("is false for a lease with no agreement end date (open-ended)", () => {
    expect(isLeaseExpiringSoon(null, "ACTIVE")).toBe(false);
  });

  it("is false for a non-ACTIVE lease even if the end date is near", () => {
    expect(isLeaseExpiringSoon(daysFromToday(5), "DRAFT")).toBe(false);
    expect(isLeaseExpiringSoon(daysFromToday(5), "ENDED")).toBe(false);
    expect(isLeaseExpiringSoon(daysFromToday(5), "CANCELLED")).toBe(false);
  });

  it("is true for an ACTIVE lease ending within 30 days", () => {
    expect(isLeaseExpiringSoon(daysFromToday(15), "ACTIVE")).toBe(true);
  });

  it("is true for an ACTIVE lease ending today", () => {
    expect(isLeaseExpiringSoon(daysFromToday(0), "ACTIVE")).toBe(true);
  });

  it("is true for an ACTIVE lease that already ended", () => {
    expect(isLeaseExpiringSoon(daysFromToday(-5), "ACTIVE")).toBe(true);
  });

  it("is false for an ACTIVE lease ending more than 30 days out", () => {
    expect(isLeaseExpiringSoon(daysFromToday(45), "ACTIVE")).toBe(false);
  });
});
