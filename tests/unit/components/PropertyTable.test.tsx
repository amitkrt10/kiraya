import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyTable } from "@/components/properties/PropertyTable";
import type { PropertyListItem } from "@/lib/queries/properties";

function makeProperty(overrides: Partial<PropertyListItem>): PropertyListItem {
  return {
    id: "prop-1",
    organization_id: "org-1",
    property_type_id: null,
    property_code: "SH-01",
    name: "Shanti Nivas",
    description: null,
    status: "ACTIVE",
    address_line_1: "14 Marine Drive",
    address_line_2: null,
    locality: null,
    city: "Kochi",
    state: "Kerala",
    postal_code: "682031",
    country_code: "IN",
    latitude: null,
    longitude: null,
    total_area: null,
    area_unit: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    property_types: { name: "Residential" },
    unit_count: 24,
    ...overrides,
  };
}

describe("PropertyTable", () => {
  it("renders a row per property with code, name, type, location, and unit count", () => {
    render(<PropertyTable properties={[makeProperty({})]} />);

    expect(screen.getByRole("link", { name: "SH-01" })).toHaveAttribute(
      "href",
      "/app/properties/prop-1",
    );
    expect(screen.getByRole("link", { name: "Shanti Nivas" })).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
    expect(screen.getByText("14 Marine Drive, Kochi")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows a dash when the property has no type assigned", () => {
    render(<PropertyTable properties={[makeProperty({ property_types: null })]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
