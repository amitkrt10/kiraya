import { describe, expect, it } from "vitest";
import {
  formatOwnershipPercentage,
  isOwnershipActive,
  summarizeOwners,
} from "@/lib/utils/ownership";
import type { PropertyOwnershipItem } from "@/lib/queries/owners";

function makeOwnership(overrides: Partial<PropertyOwnershipItem>): PropertyOwnershipItem {
  return {
    id: "own-1",
    organization_id: "org-1",
    property_id: "prop-1",
    owner_id: "owner-1",
    ownership_percentage: 60,
    ownership_start_date: null,
    ownership_end_date: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    owners: { id: "owner-1", display_name: "Rajesh Kumar Trust", phone: null, email: null },
    ...overrides,
  };
}

describe("formatOwnershipPercentage", () => {
  it("shows whole numbers without a decimal point", () => {
    expect(formatOwnershipPercentage(60)).toBe("60%");
    expect(formatOwnershipPercentage(100)).toBe("100%");
  });

  it("preserves the exact authoritative fractional value rather than rounding it away", () => {
    expect(formatOwnershipPercentage(33.3333)).toBe("33.3333%");
  });
});

describe("isOwnershipActive", () => {
  const asOf = new Date("2026-06-15T00:00:00Z");

  it("is active with no start/end dates", () => {
    expect(isOwnershipActive(makeOwnership({}), asOf)).toBe(true);
  });

  it("is inactive when the end date is in the past", () => {
    expect(
      isOwnershipActive(makeOwnership({ ownership_end_date: "2026-01-01" }), asOf),
    ).toBe(false);
  });

  it("is inactive when the start date is in the future", () => {
    expect(
      isOwnershipActive(makeOwnership({ ownership_start_date: "2027-01-01" }), asOf),
    ).toBe(false);
  });
});

describe("summarizeOwners", () => {
  it("returns 'No owner assigned' for an empty list", () => {
    expect(summarizeOwners([])).toBe("No owner assigned");
  });

  it("returns the single active owner's name", () => {
    expect(summarizeOwners([makeOwnership({})])).toBe("Rajesh Kumar Trust");
  });

  it("names the highest-percentage owner and counts the rest", () => {
    const ownerships = [
      makeOwnership({ id: "a", ownership_percentage: 40, owners: { id: "1", display_name: "Owner A", phone: null, email: null } }),
      makeOwnership({ id: "b", ownership_percentage: 60, owners: { id: "2", display_name: "Owner B", phone: null, email: null } }),
    ];
    expect(summarizeOwners(ownerships)).toBe("Owner B & 1 other");
  });

  it("ignores ended ownership records", () => {
    const ownerships = [makeOwnership({ ownership_end_date: "2020-01-01" })];
    expect(summarizeOwners(ownerships)).toBe("No owner assigned");
  });
});
