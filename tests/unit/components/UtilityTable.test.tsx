import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UtilityTable } from "@/components/utilities/UtilityTable";
import type { UtilityListItem } from "@/lib/queries/utilities";

function makeUtility(overrides: Partial<UtilityListItem>): UtilityListItem {
  return {
    id: "util-1",
    organization_id: "org-1",
    code: "ELEC",
    name: "Electricity",
    description: null,
    unit_name: "kWh",
    is_metered: true,
    is_system: false,
    is_active: true,
    sort_order: 0,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    configuration_count: 3,
    ...overrides,
  };
}

describe("UtilityTable", () => {
  it("renders a row per utility with name, code, type, scope, configuration count, and status", () => {
    render(<UtilityTable utilities={[makeUtility({})]} />);

    expect(screen.getByRole("link", { name: "Electricity" })).toHaveAttribute("href", "/app/utilities/util-1");
    expect(screen.getByText("ELEC")).toBeInTheDocument();
    expect(screen.getByText("Metered")).toBeInTheDocument();
    expect(screen.getByText("Org-specific")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Fixed instead of Metered when is_metered is false", () => {
    render(<UtilityTable utilities={[makeUtility({ is_metered: false })]} />);
    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });

  it("shows Shared scope for a globally shared utility (organization_id IS NULL)", () => {
    render(<UtilityTable utilities={[makeUtility({ organization_id: null })]} />);
    expect(screen.getByText("Shared")).toBeInTheDocument();
  });

  it("renders nothing in the body when there are no utilities (caller handles the empty state)", () => {
    render(<UtilityTable utilities={[]} />);
    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});
