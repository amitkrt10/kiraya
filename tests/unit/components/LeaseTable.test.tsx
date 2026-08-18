import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaseTable } from "@/components/leases/LeaseTable";
import type { LeaseListItem } from "@/lib/queries/leases";

function daysFromToday(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeLease(overrides: Partial<LeaseListItem>): LeaseListItem {
  return {
    id: "lease-1",
    organization_id: "org-1",
    lease_code: "LSE-01",
    tenant_id: "tenant-1",
    unit_id: "unit-1",
    status: "ACTIVE",
    agreement_start_date: "2026-01-01",
    agreement_end_date: "2026-12-31",
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

describe("LeaseTable", () => {
  it("renders a row per lease with code, tenant, property, unit, dates, and status", () => {
    render(<LeaseTable leases={[makeLease({})]} />);

    expect(screen.getByRole("link", { name: "LSE-01" })).toHaveAttribute("href", "/app/leases/lease-1");
    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/app/tenants/tenant-1");
    expect(screen.getByText("Shanti Nivas")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows an Expiring tag for an ACTIVE lease ending within 30 days", () => {
    render(<LeaseTable leases={[makeLease({ agreement_end_date: daysFromToday(10) })]} />);
    expect(screen.getByText("Expiring")).toBeInTheDocument();
  });

  it("does not show an Expiring tag for an open-ended lease", () => {
    render(<LeaseTable leases={[makeLease({ agreement_end_date: null })]} />);
    expect(screen.queryByText("Expiring")).not.toBeInTheDocument();
    expect(screen.getByText("Open-ended")).toBeInTheDocument();
  });

  it("shows a dash when the lease has no tenant or unit linked", () => {
    render(<LeaseTable leases={[makeLease({ tenants: null, units: null })]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
