import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PastOccupanciesList } from "@/components/units/PastOccupanciesList";
import type { LeaseListItem } from "@/lib/queries/leases";

function makeLease(overrides: Partial<LeaseListItem> = {}): LeaseListItem {
  return {
    id: "lease-a",
    organization_id: "org-1",
    tenant_id: "tenant-a",
    unit_id: "unit-1",
    lease_code: "LSE-A",
    status: "ENDED",
    agreement_start_date: "2024-01-01",
    agreement_end_date: null,
    occupancy_start_date: "2024-01-01",
    actual_end_date: "2025-06-30",
    notice_date: null,
    move_in_date: null,
    move_out_date: null,
    currency_code: "INR",
    notes: null,
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2025-06-30T00:00:00Z",
    tenants: { display_name: "Tenant A", tenant_code: "TEN-A" },
    units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } },
    ...overrides,
  };
}

describe("PastOccupanciesList — P6.3-J: Unit Detail's ended-occupancy history", () => {
  it("shows the empty state when there are no past occupancies", () => {
    render(<PastOccupanciesList unitId="unit-1" pastLeases={[]} />);

    expect(screen.getByText("No past occupancies")).toBeInTheDocument();
  });

  it("shows one row per ended occupancy, each linking to its exact occupancy route — never the bare unit page", () => {
    render(<PastOccupanciesList unitId="unit-1" pastLeases={[makeLease()]} />);

    expect(screen.getByText("Tenant A")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("2025-06-30")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tenant A" })).toHaveAttribute("href", "/app/units/unit-1/occupancies/lease-a");
  });

  it("shows every past occupancy as its own distinct row, never collapsed together (P6.3-I Case E)", () => {
    const leaseA = makeLease({ id: "lease-a", tenants: { display_name: "Tenant A", tenant_code: "TEN-A" } });
    const leaseB = makeLease({
      id: "lease-b",
      tenant_id: "tenant-b",
      occupancy_start_date: "2025-07-01",
      actual_end_date: "2026-01-31",
      tenants: { display_name: "Tenant B", tenant_code: "TEN-B" },
    });

    render(<PastOccupanciesList unitId="unit-1" pastLeases={[leaseB, leaseA]} />);

    expect(screen.getByRole("link", { name: "Tenant A" })).toHaveAttribute("href", "/app/units/unit-1/occupancies/lease-a");
    expect(screen.getByRole("link", { name: "Tenant B" })).toHaveAttribute("href", "/app/units/unit-1/occupancies/lease-b");
  });
});
