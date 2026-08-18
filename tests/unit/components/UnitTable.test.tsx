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
    name: null,
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
    render(<UnitTable propertyId="prop-1" units={[]} unitTypes={[]} canWrite={false} />);
    expect(screen.getByText("No units yet")).toBeInTheDocument();
  });

  it("renders unit rows with the P5.2B column set (not tenant/rent/lease columns)", () => {
    render(<UnitTable propertyId="prop-1" units={[makeUnit({})]} unitTypes={[]} canWrite={false} />);

    expect(screen.getByRole("link", { name: "A-101" })).toHaveAttribute("href", "/app/units/unit-1");
    expect(screen.getByText("Flat")).toBeInTheDocument();
    expect(screen.getByText("850 sq_ft")).toBeInTheDocument();
    expect(screen.getByText("Vacant")).toBeInTheDocument();
    expect(screen.queryByText("Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.queryByText("Lease Ends")).not.toBeInTheDocument();
  });

  it("does not show the add-unit action when the viewer can't write", () => {
    render(<UnitTable propertyId="prop-1" units={[makeUnit({})]} unitTypes={[]} canWrite={false} />);
    expect(screen.queryByRole("button", { name: /Add Unit/i })).not.toBeInTheDocument();
  });
});
