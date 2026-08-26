import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UnitDetail } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";

// UnitHeaderBand renders UnitFormDrawer (client) when canWrite=true, which pulls in
// Server Actions that import "server-only" — inert under Next's bundler, but
// this file runs under plain Vitest where the package throws unconditionally.
vi.mock("server-only", () => ({}));

const { UnitHeaderBand } = await import("@/components/units/UnitHeaderBand");

const unitTypes: UnitType[] = [];

function makeUnit(overrides: Partial<UnitDetail> = {}): UnitDetail {
  return {
    id: "unit-1",
    organization_id: "org-1",
    property_id: "property-1",
    unit_type_id: null,
    unit_code: "A-101",
    name: null,
    description: null,
    status: "VACANT",
    floor_number: null,
    area: null,
    area_unit: null,
    bedrooms: null,
    bathrooms: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    unit_types: null,
    properties: { id: "property-1", name: "Shanti Nivas", property_code: "SH-01" },
    ...overrides,
  } as UnitDetail;
}

describe("UnitHeaderBand — P6.3-H: occupancy status is never unit.status alone", () => {
  it("shows Occupied when the unit has an ACTIVE tenant, even though unit.status is still the raw VACANT default", () => {
    render(<UnitHeaderBand unit={makeUnit({ status: "VACANT" })} unitTypes={unitTypes} canWrite={false} isOccupied={true} />);

    expect(screen.getByText("Occupied")).toBeInTheDocument();
    expect(screen.queryByText("Vacant")).not.toBeInTheDocument();
  });

  it("shows Vacant when the unit has no ACTIVE tenant and a normal status", () => {
    render(<UnitHeaderBand unit={makeUnit({ status: "VACANT" })} unitTypes={unitTypes} canWrite={false} isOccupied={false} />);

    expect(screen.getByText("Vacant")).toBeInTheDocument();
  });

  it("still shows Maintenance even when the unit happens to have an ACTIVE tenant", () => {
    render(<UnitHeaderBand unit={makeUnit({ status: "MAINTENANCE" })} unitTypes={unitTypes} canWrite={false} isOccupied={true} />);

    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.queryByText("Occupied")).not.toBeInTheDocument();
  });

  it("shows Unavailable when the unit is marked unavailable and has no ACTIVE tenant", () => {
    render(<UnitHeaderBand unit={makeUnit({ status: "UNAVAILABLE" })} unitTypes={unitTypes} canWrite={false} isOccupied={false} />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
