import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OccupancyDetailHeader } from "@/components/units/OccupancyDetailHeader";
import type { LeaseDetail } from "@/lib/queries/leases";

function makeLease(overrides: Partial<LeaseDetail> = {}): LeaseDetail {
  return {
    id: "lease-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    unit_id: "unit-1",
    lease_code: "LSE-01",
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
    tenants: { id: "tenant-1", display_name: "Tenant A", tenant_code: "TEN-A" },
    units: { id: "unit-1", unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } },
    ...overrides,
  };
}

describe("OccupancyDetailHeader — P6.3-J: identifies the exact occupancy, current or ended", () => {
  it("labels an ENDED lease as Past Occupancy and shows its tenant, dates, and status", () => {
    render(<OccupancyDetailHeader unitId="unit-1" lease={makeLease()} />);

    expect(screen.getByText("Past Occupancy")).toBeInTheDocument();
    expect(screen.getByText("Tenant A")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("2025-06-30")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });

  it("labels an ACTIVE lease as Current Occupancy", () => {
    render(<OccupancyDetailHeader unitId="unit-1" lease={makeLease({ status: "ACTIVE", actual_end_date: null })} />);

    expect(screen.getByText("Current Occupancy")).toBeInTheDocument();
    expect(screen.queryByText("Past Occupancy")).not.toBeInTheDocument();
  });

  it("links back to the unit's own page, and to the tenant's page", () => {
    render(<OccupancyDetailHeader unitId="unit-1" lease={makeLease()} />);

    expect(screen.getByRole("link", { name: /Shanti Nivas.*A-101/ })).toHaveAttribute("href", "/app/units/unit-1");
    expect(screen.getByRole("link", { name: "View Tenant" })).toHaveAttribute("href", "/app/tenants/tenant-1");
  });

  it("never offers an Assign Tenant action — that belongs to the unit's own current-occupancy page only", () => {
    render(<OccupancyDetailHeader unitId="unit-1" lease={makeLease()} />);

    expect(screen.queryByRole("button", { name: "Assign Tenant" })).not.toBeInTheDocument();
  });
});
