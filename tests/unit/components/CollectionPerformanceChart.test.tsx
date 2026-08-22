import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CollectionPerformanceChart } from "@/components/dashboard/CollectionPerformanceChart";
import type { OrganizationDashboardRow } from "@/lib/queries/dashboard";

function makeRow(overrides: Partial<OrganizationDashboardRow>): OrganizationDashboardRow {
  return {
    organization_id: "org-a",
    period_month: "2026-07-01",
    property_count: 0,
    unit_count: 0,
    occupied_unit_count: 0,
    vacant_unit_count: 0,
    occupancy_percentage: 0,
    active_tenant_count: 0,
    billed_amount: 0,
    collected_amount: 0,
    period_collection_gap: 0,
    collection_percentage: 0,
    active_tenant_dues: 0,
    active_tenant_credits: 0,
    ...overrides,
  };
}

describe("CollectionPerformanceChart", () => {
  it("shows an honest empty message instead of an empty chart when there's no billing history yet", () => {
    render(<CollectionPerformanceChart monthly={[]} />);

    expect(screen.getByText(/No billing activity yet/)).toBeInTheDocument();
  });

  it("renders one bar per month using collection_percentage straight from the view — no recomputed math", () => {
    render(
      <CollectionPerformanceChart
        monthly={[
          makeRow({ period_month: "2026-06-01", collection_percentage: 94 }),
          makeRow({ period_month: "2026-07-01", collection_percentage: 50 }),
        ]}
      />,
    );

    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("clamps an out-of-range percentage rather than rendering a bar taller than the track", () => {
    render(<CollectionPerformanceChart monthly={[makeRow({ collection_percentage: 250 })]} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
