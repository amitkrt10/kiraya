import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UnitListItem } from "@/lib/queries/units";

// UnitTable renders UnitFormDrawer (client) when canWrite=true, which pulls in
// Server Actions that import "server-only" — inert under Next's bundler, but
// this file runs under plain Vitest where the package throws unconditionally.
vi.mock("server-only", () => ({}));

const { UnitTable } = await import("@/components/units/UnitTable");

function makeUnit(overrides: Partial<UnitListItem>): UnitListItem {
  return {
    id: "unit-1",
    organization_id: "org-1",
    property_id: "prop-1",
    unit_type_id: null,
    unit_code: "A-101",
    description: null,
    status: "VACANT",
    floor_number: 1,
    area: 850,
    area_unit: "sq_ft",
    bedrooms: 2,
    bathrooms: 2,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    unit_types: { name: "Flat" },
    ...overrides,
  };
}

describe("UnitTable", () => {
  it("shows an empty state with no units", () => {
    render(
      <UnitTable
        propertyId="prop-1"
        units={[]}
        unitTypes={[]}
        currentLeases={{}}
        canWrite={false}
        suggestedUnitCode="TST-001"
      />,
    );
    expect(screen.getByText("No units yet")).toBeInTheDocument();
  });

  it("renders unit rows with the current column set (not rent/lease-ends columns)", () => {
    render(
      <UnitTable
        propertyId="prop-1"
        units={[makeUnit({})]}
        unitTypes={[]}
        currentLeases={{}}
        canWrite={false}
        suggestedUnitCode="TST-001"
      />,
    );

    expect(screen.getByRole("link", { name: "A-101" })).toHaveAttribute("href", "/app/units/unit-1");
    expect(screen.getByText("Flat")).toBeInTheDocument();
    expect(screen.getByText("850 sq_ft")).toBeInTheDocument();
    expect(screen.getByText("Vacant")).toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.queryByText("Lease Ends")).not.toBeInTheDocument();
  });

  it("shows the current tenant when an active lease is present", () => {
    render(
      <UnitTable
        propertyId="prop-1"
        units={[makeUnit({})]}
        unitTypes={[]}
        currentLeases={{
          "unit-1": {
            id: "lease-1",
            organization_id: "org-1",
            lease_code: "LSE-1",
            tenant_id: "tenant-1",
            unit_id: "unit-1",
            status: "ACTIVE",
            agreement_start_date: "2026-01-01",
            agreement_end_date: null,
            occupancy_start_date: "2026-01-01",
            actual_end_date: null,
            notice_date: null,
            move_in_date: null,
            move_out_date: null,
            currency_code: "INR",
            notes: null,
            metadata: {},
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            tenants: { display_name: "Asha Rao", tenant_code: "TEN-1" },
            units: null,
          },
        }}
        canWrite={false}
        suggestedUnitCode="TST-001"
      />,
    );

    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/app/tenants/tenant-1");
  });

  it("does not show the add-unit action when the viewer can't write", () => {
    render(
      <UnitTable
        propertyId="prop-1"
        units={[makeUnit({})]}
        unitTypes={[]}
        currentLeases={{}}
        canWrite={false}
        suggestedUnitCode="TST-001"
      />,
    );
    expect(screen.queryByRole("button", { name: /Add Unit/i })).not.toBeInTheDocument();
  });
});
