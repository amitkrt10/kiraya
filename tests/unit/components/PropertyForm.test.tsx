import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyForm } from "@/components/properties/PropertyForm";
import type { PropertyActionState } from "@/lib/actions/properties";
import type { PropertyDetail } from "@/lib/queries/properties";

const noopAction = () => {};
const emptyState: PropertyActionState = {};

function makePropertyDetail(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: "prop-1",
    organization_id: "org-1",
    property_type_id: null,
    property_code: "LEGACY-CODE",
    name: "Shanti Nivas",
    description: null,
    status: "ACTIVE",
    address_line_1: null,
    address_line_2: null,
    locality: null,
    city: null,
    state: null,
    postal_code: null,
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

describe("PropertyForm — Property Code default", () => {
  it("shows the suggested code as the initial value when creating a new property", () => {
    render(
      <PropertyForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        propertyTypes={[]}
        suggestedPropertyCode="RNT-001"
      />,
    );

    expect(screen.getByLabelText("Property Code")).toHaveValue("RNT-001");
  });

  it("lets the user edit the suggested code", async () => {
    const user = userEvent.setup();
    render(
      <PropertyForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        propertyTypes={[]}
        suggestedPropertyCode="RNT-001"
      />,
    );

    const input = screen.getByLabelText("Property Code");
    await user.clear(input);
    await user.type(input, "RNT-HQ");

    expect(input).toHaveValue("RNT-HQ");
  });

  it("does not overwrite the user's edited value if the component re-renders with a new suggestion", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PropertyForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        propertyTypes={[]}
        suggestedPropertyCode="RNT-001"
      />,
    );

    const input = screen.getByLabelText("Property Code");
    await user.clear(input);
    await user.type(input, "RNT-HQ");

    // A later suggestion (e.g. from a revalidated server render) must never
    // clobber what the user already typed — defaultValue is only applied
    // at mount, never on re-render, which is exactly what this proves.
    rerender(
      <PropertyForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        propertyTypes={[]}
        suggestedPropertyCode="RNT-002"
      />,
    );

    expect(screen.getByLabelText("Property Code")).toHaveValue("RNT-HQ");
  });

  it("prefers the existing property's real code over any suggestion when editing", () => {
    render(
      <PropertyForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        propertyTypes={[]}
        property={makePropertyDetail({ property_code: "LEGACY-CODE" })}
        suggestedPropertyCode="RNT-002"
      />,
    );

    expect(screen.getByLabelText("Property Code")).toHaveValue("LEGACY-CODE");
  });
});
