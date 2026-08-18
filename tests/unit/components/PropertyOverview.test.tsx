import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyOverview } from "@/components/properties/PropertyOverview";
import type { PropertyDetail } from "@/lib/queries/properties";

function makeProperty(overrides: Partial<PropertyDetail>): PropertyDetail {
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
    property_types: null,
    ...overrides,
  };
}

describe("PropertyOverview", () => {
  it("shows fields that have values", () => {
    render(<PropertyOverview property={makeProperty({})} />);
    expect(screen.getByText("SH-01")).toBeInTheDocument();
    expect(screen.getByText("Shanti Nivas")).toBeInTheDocument();
    expect(screen.getByText(/14 Marine Drive/)).toBeInTheDocument();
  });

  it("omits rows for empty/null fields instead of showing blank rows", () => {
    render(<PropertyOverview property={makeProperty({})} />);
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Area")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("shows total area with its unit when present", () => {
    render(
      <PropertyOverview
        property={makeProperty({ total_area: 1200, area_unit: "sq_ft", property_types: { id: "t1", name: "Residential" } })}
      />,
    );
    expect(screen.getByText("1200 sq_ft")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
  });
});
