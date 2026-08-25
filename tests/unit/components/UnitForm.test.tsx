import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnitForm } from "@/components/units/UnitForm";
import type { UnitActionState } from "@/lib/actions/units";
import type { UnitDetail } from "@/lib/queries/units";

const noopAction = () => {};
const emptyState: UnitActionState = {};

function makeUnitDetail(overrides: Partial<UnitDetail> = {}): UnitDetail {
  return {
    id: "unit-1",
    organization_id: "org-1",
    property_id: "prop-1",
    unit_type_id: null,
    unit_code: "LEGACY-CODE",
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
    properties: null,
    ...overrides,
  };
}

describe("UnitForm — Unit Code default", () => {
  it("shows the suggested code as the initial value when creating a new unit", () => {
    render(
      <UnitForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        unitTypes={[]}
        suggestedUnitCode="KB-001"
      />,
    );

    expect(screen.getByLabelText("Unit Code")).toHaveValue("KB-001");
  });

  it("lets the user edit the suggested code", async () => {
    const user = userEvent.setup();
    render(
      <UnitForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        unitTypes={[]}
        suggestedUnitCode="KB-001"
      />,
    );

    const input = screen.getByLabelText("Unit Code");
    await user.clear(input);
    await user.type(input, "KB-PENTHOUSE");

    expect(input).toHaveValue("KB-PENTHOUSE");
  });

  it("does not overwrite the user's edited value if the component re-renders with a new suggestion", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <UnitForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        unitTypes={[]}
        suggestedUnitCode="KB-001"
      />,
    );

    const input = screen.getByLabelText("Unit Code");
    await user.clear(input);
    await user.type(input, "KB-PENTHOUSE");

    rerender(
      <UnitForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        unitTypes={[]}
        suggestedUnitCode="KB-002"
      />,
    );

    expect(screen.getByLabelText("Unit Code")).toHaveValue("KB-PENTHOUSE");
  });

  it("prefers the existing unit's real code over any suggestion when editing", () => {
    render(
      <UnitForm
        formId="f"
        formAction={noopAction}
        state={emptyState}
        unitTypes={[]}
        unit={makeUnitDetail({ unit_code: "LEGACY-CODE" })}
        suggestedUnitCode="KB-002"
      />,
    );

    expect(screen.getByLabelText("Unit Code")).toHaveValue("LEGACY-CODE");
  });
});
