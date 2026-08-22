import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import type { OrganizationDashboardRow } from "@/lib/queries/dashboard";

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

describe("DashboardKpiStrip — renders authoritative values only, never invented deltas", () => {
  it("renders every KPI value straight from the view row, with no client-side math", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={0} />);

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("23.9%")).toBeInTheDocument();
    expect(screen.getByText("71")).toBeInTheDocument();
    expect(screen.getByText("₹1,98,900")).toBeInTheDocument();
  });

  it("shows the real vacant-unit count as the Units delta, not an invented one", () => {
    render(<DashboardKpiStrip latest={makeRow({ vacant_unit_count: 50 })} overdueCount={0} />);

    expect(screen.getByText("50 vacant")).toBeInTheDocument();
  });

  it("shows the overdue-bill count as the Outstanding delta when there are overdue bills", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={3} />);

    expect(screen.getByText("3 bills overdue")).toBeInTheDocument();
  });

  it("says no bills are overdue when the count is zero, rather than a blank or negative-sounding line", () => {
    render(<DashboardKpiStrip latest={makeRow({})} overdueCount={0} />);

    expect(screen.getByText("No bills overdue")).toBeInTheDocument();
  });

  it("renders a full zero-value KPI strip for an organization with no billing activity yet, instead of crashing on a null latest row", () => {
    render(<DashboardKpiStrip latest={null} overdueCount={0} />);

    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹0").length).toBe(2); // Outstanding and Collected
  });
});
