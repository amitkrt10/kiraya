import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExitTable } from "@/components/tenantExits/ExitTable";
import type { TenantExitListItem } from "@/lib/queries/tenantExits";

function makeExit(overrides: Partial<TenantExitListItem>): TenantExitListItem {
  return {
    id: "exit-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    exit_reference: "EXT-01",
    notice_date: "2026-02-01",
    planned_exit_date: "2026-03-01",
    actual_exit_date: null,
    handover_date: null,
    status: "INITIATED",
    reason: null,
    final_meter_reading_date: null,
    initiated_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    tenants: { display_name: "Asha Rao", tenant_code: "TEN-01" },
    leases: { lease_code: "LSE-01", units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } } },
    ...overrides,
  };
}

describe("ExitTable", () => {
  it("renders a row per exit with reference, tenant, property, unit, dates, and status", () => {
    render(<ExitTable exits={[makeExit({})]} />);

    expect(screen.getByRole("link", { name: "EXT-01" })).toHaveAttribute("href", "/app/exits/exit-1/review");
    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/app/tenants/tenant-1");
    expect(screen.getByText("Shanti Nivas")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("2026-02-01")).toBeInTheDocument();
    expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    expect(screen.getByText("Initiated")).toBeInTheDocument();
  });

  it("prefers actual_exit_date over planned_exit_date once the exit is complete", () => {
    render(<ExitTable exits={[makeExit({ status: "COMPLETED", actual_exit_date: "2026-03-05" })]} />);

    expect(screen.getByText("2026-03-05")).toBeInTheDocument();
    expect(screen.queryByText("2026-03-01")).not.toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows the Pending Settlement and Cancelled status tags correctly", () => {
    const { rerender } = render(<ExitTable exits={[makeExit({ status: "PENDING_SETTLEMENT" })]} />);
    expect(screen.getByText("Pending Settlement")).toBeInTheDocument();

    rerender(<ExitTable exits={[makeExit({ status: "CANCELLED" })]} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("shows a dash when the exit has no tenant or lease/unit/property linked", () => {
    render(<ExitTable exits={[makeExit({ tenants: null, leases: null, notice_date: null })]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders nothing in the body when there are no exits (caller handles the empty state)", () => {
    render(<ExitTable exits={[]} />);
    expect(screen.queryAllByRole("row")).toHaveLength(1); // header row only
  });
});
