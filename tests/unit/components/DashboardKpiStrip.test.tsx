import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import type { OrganizationDashboardRow } from "@/lib/queries/dashboard";
import type { PropertyUnitCounts } from "@/lib/queries/properties";

function makeRow(overrides: Partial<OrganizationDashboardRow>): OrganizationDashboardRow {
  return {
    organization_id: "org-a",
    period_month: "2026-07-01",
    property_count: 7,
    unit_count: 67,
    occupied_unit_count: 16,
    vacant_unit_count: 50,
    occupancy_percentage: 23.88,
    active_tenant_count: 71,
    billed_amount: 0,
    collected_amount: 0,
    period_collection_gap: 0,
    collection_percentage: 0,
    active_tenant_dues: 198900,
    active_tenant_credits: 279000,
    ...overrides,
  };
}

function makeUnitCounts(overrides: Partial<PropertyUnitCounts> = {}): PropertyUnitCounts {
  return {
    totalUnits: 67,
    occupiedUnits: 17,
    vacantUnits: 50,
    maintenanceUnits: 0,
    unavailableUnits: 0,
    occupancyPercentage: 25.37,
    ...overrides,
  };
}

describe("DashboardKpiStrip — renders authoritative values only, never invented deltas", () => {
  it("renders every KPI value straight from the view row, with no client-side math", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={0} unitCounts={makeUnitCounts({})} />);

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("71")).toBeInTheDocument();
    expect(screen.getByText("₹1,98,900")).toBeInTheDocument();
  });

  it("P6.3-E: Units/Occupancy/vacant come from the authoritative ACTIVE-lease-derived unitCounts, never from the view's own units.status-based columns", () => {
    render(
      <DashboardKpiStrip
        latest={makeRow({ unit_count: 67, vacant_unit_count: 50, occupancy_percentage: 23.88 })}
        overdueCount={0}
        unitCounts={makeUnitCounts({ totalUnits: 67, vacantUnits: 12, occupancyPercentage: 82.09 })}
      />,
    );

    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("12 vacant")).toBeInTheDocument();
    expect(screen.queryByText("50 vacant")).not.toBeInTheDocument();
    expect(screen.getByText("82.1%")).toBeInTheDocument();
    expect(screen.queryByText("23.9%")).not.toBeInTheDocument();
  });

  it("shows the overdue-bill count as the Outstanding delta when there are overdue bills", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={3} unitCounts={makeUnitCounts({})} />);

    expect(screen.getByText("3 bills overdue")).toBeInTheDocument();
  });

  it("says no bills are overdue when the count is zero, rather than a blank or negative-sounding line", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={0} unitCounts={makeUnitCounts({})} />);

    expect(screen.getByText("No bills overdue")).toBeInTheDocument();
  });

  it("renders a full zero-value KPI strip for an organization with no billing activity yet, instead of crashing on a null latest row", () => {
    render(<DashboardKpiStrip latest={null} overdueCount={0} unitCounts={makeUnitCounts({ totalUnits: 0, vacantUnits: 0, occupancyPercentage: 0 })} />);

    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹0").length).toBe(2); // Outstanding and Collected
  });

  it("still shows real Units/Occupancy figures even when there's no billing history yet (unitCounts doesn't depend on latest)", () => {
    render(
      <DashboardKpiStrip
        latest={null}
        overdueCount={0}
        unitCounts={makeUnitCounts({ totalUnits: 9, vacantUnits: 2, occupancyPercentage: 77.78 })}
      />,
    );

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("2 vacant")).toBeInTheDocument();
    expect(screen.getByText("77.8%")).toBeInTheDocument();
  });
});
