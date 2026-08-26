import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantLeaseList } from "@/components/tenants/TenantLeaseList";
import type { LeaseListItem } from "@/lib/queries/leases";

function makeLease(overrides: Partial<LeaseListItem> = {}): LeaseListItem {
  return {
    id: "lease-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    unit_id: "unit-1",
    lease_code: "LSE-01",
    status: "ACTIVE",
    agreement_start_date: "2026-01-01",
    agreement_end_date: null,
    occupancy_start_date: "2026-01-01",
    actual_end_date: null,
    notice_date: null,
    move_in_date: null,
    move_out_date: null,
    currency_code: "INR",
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    tenants: { display_name: "Asha Rao", tenant_code: "TEN-01" },
    units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } },
    ...overrides,
  };
}

describe("TenantLeaseList — P6.3-F: the only remaining place a completed exit's real end date is visible", () => {
  it("shows the empty state when there's no occupancy history", () => {
    render(<TenantLeaseList leases={[]} />);

    expect(screen.getByText("No occupancy history for this tenant")).toBeInTheDocument();
  });

  it("links each row to its exact occupancy — never the bare unit page or /app/leases — and never shows the internal lease code", () => {
    render(<TenantLeaseList leases={[makeLease({ id: "lease-99", unit_id: "unit-42" })]} />);

    const link = screen.getByRole("link", { name: /Shanti Nivas.*A-101/ });
    // P6.3-J: the bare unit page only ever shows whichever occupancy is
    // ACTIVE *today* — for an ended row on a since-reassigned unit that
    // silently substitutes a different tenant's current data (P6.3-I).
    expect(link).toHaveAttribute("href", "/app/units/unit-42/occupancies/lease-99");
    expect(screen.queryByText("LSE-01")).not.toBeInTheDocument();
  });

  it("prefers actual_end_date (a completed exit's real end date) over agreement_end_date when both are set", () => {
    render(
      <TenantLeaseList
        leases={[makeLease({ status: "ENDED", agreement_end_date: "2026-12-31", actual_end_date: "2026-09-15" })]}
      />,
    );

    expect(screen.getByText("2026-09-15")).toBeInTheDocument();
    expect(screen.queryByText("2026-12-31")).not.toBeInTheDocument();
  });

  it("falls back to agreement_end_date when there's no actual_end_date (occupancy hasn't ended)", () => {
    render(<TenantLeaseList leases={[makeLease({ agreement_end_date: "2026-12-31", actual_end_date: null })]} />);

    expect(screen.getByText("2026-12-31")).toBeInTheDocument();
  });

  it("falls back to 'Open-ended' when neither date is set", () => {
    render(<TenantLeaseList leases={[makeLease({ agreement_end_date: null, actual_end_date: null })]} />);

    expect(screen.getByText("Open-ended")).toBeInTheDocument();
  });

  it("shows the occupancy status tag", () => {
    render(<TenantLeaseList leases={[makeLease({ status: "ENDED" })]} />);

    expect(screen.getByText("Ended")).toBeInTheDocument();
  });
});
