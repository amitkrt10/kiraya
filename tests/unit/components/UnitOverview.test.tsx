import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnitOverview } from "@/components/units/UnitOverview";
import type { UnitDetail } from "@/lib/queries/units";

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

describe("UnitOverview — P6.3-H: the Status row is never unit.status alone", () => {
  it("shows Occupied when the unit has an ACTIVE tenant, even though unit.status is still the raw VACANT default", () => {
    render(<UnitOverview unit={makeUnit({ status: "VACANT" })} isOccupied={true} />);

    expect(screen.getByText("Occupied")).toBeInTheDocument();
    expect(screen.queryByText("Vacant")).not.toBeInTheDocument();
  });

  it("shows Vacant when the unit has no ACTIVE tenant and a normal status", () => {
    render(<UnitOverview unit={makeUnit({ status: "VACANT" })} isOccupied={false} />);

    expect(screen.getByText("Vacant")).toBeInTheDocument();
  });

  it("still shows Maintenance even when the unit happens to have an ACTIVE tenant", () => {
    render(<UnitOverview unit={makeUnit({ status: "MAINTENANCE" })} isOccupied={true} />);

    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.queryByText("Occupied")).not.toBeInTheDocument();
  });

  it("shows Unavailable when the unit is marked unavailable and has no ACTIVE tenant", () => {
    render(<UnitOverview unit={makeUnit({ status: "UNAVAILABLE" })} isOccupied={false} />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
