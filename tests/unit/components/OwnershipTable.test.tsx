import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PropertyOwnershipItem } from "@/lib/queries/owners";

// See UnitTable.test.tsx — OwnershipFormDrawer (rendered when canWrite=true)
// transitively imports "server-only" via Server Actions.
vi.mock("server-only", () => ({}));

const { OwnershipTable } = await import("@/components/properties/OwnershipTable");

function makeOwnership(overrides: Partial<PropertyOwnershipItem>): PropertyOwnershipItem {
  return {
    id: "own-1",
    organization_id: "org-1",
    property_id: "prop-1",
    owner_id: "owner-1",
    ownership_percentage: 100,
    ownership_start_date: null,
    ownership_end_date: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    owners: { id: "owner-1", display_name: "Rajesh Kumar Trust", phone: null, email: "rajesh.trust@email.com" },
    ...overrides,
  };
}

describe("OwnershipTable", () => {
  it("shows an empty state with no ownership records", () => {
    render(<OwnershipTable propertyId="prop-1" ownerships={[]} owners={[]} canWrite={false} />);
    expect(screen.getByText("No ownership records")).toBeInTheDocument();
  });

  it("renders owner name, percentage, and contact", () => {
    render(
      <OwnershipTable propertyId="prop-1" ownerships={[makeOwnership({})]} owners={[]} canWrite={false} />,
    );

    expect(screen.getByText("Rajesh Kumar Trust")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("rajesh.trust@email.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows the ended date for a past ownership record instead of 'Active'", () => {
    render(
      <OwnershipTable
        propertyId="prop-1"
        ownerships={[makeOwnership({ ownership_end_date: "2020-01-01" })]}
        owners={[]}
        canWrite={false}
      />,
    );
    expect(screen.getByText("Ended 2020-01-01")).toBeInTheDocument();
  });

  it("does not render edit/end actions when the viewer can't write", () => {
    render(
      <OwnershipTable propertyId="prop-1" ownerships={[makeOwnership({})]} owners={[]} canWrite={false} />,
    );
    expect(screen.queryByRole("button", { name: /Add Owner/i })).not.toBeInTheDocument();
  });
});
