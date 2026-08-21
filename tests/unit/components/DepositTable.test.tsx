import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DepositTable } from "@/components/securityDeposits/DepositTable";
import type { SecurityDepositListItem } from "@/lib/queries/securityDeposits";

function makeDeposit(overrides: Partial<SecurityDepositListItem>): SecurityDepositListItem {
  return {
    id: "dep-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    deposit_reference: "DEP-01",
    required_amount: 25000,
    currency_code: "INR",
    status: "RECEIVED",
    received_amount: 20000,
    deducted_amount: 3000,
    refunded_amount: 1000,
    outstanding_amount: 5000,
    notes: null,
    metadata: {},
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z",
    tenants: { display_name: "Asha Rao", tenant_code: "TEN-01" },
    leases: { lease_code: "LSE-01", units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } } },
    held: 16000,
    ...overrides,
  };
}

describe("DepositTable", () => {
  it("renders a row per deposit with reference, tenant, property, unit, amounts, date, and status", () => {
    render(<DepositTable deposits={[makeDeposit({})]} />);

    expect(screen.getByRole("link", { name: "DEP-01" })).toHaveAttribute("href", "/app/tenants/tenant-1?tab=deposit");
    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/app/tenants/tenant-1?tab=deposit");
    expect(screen.getByText("Shanti Nivas")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("2026-01-05")).toBeInTheDocument();
    // "Received" is also a column header, so scope to the status tag's own span.
    expect(screen.getByText("Received", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("₹25,000.00")).toBeInTheDocument(); // Required
    expect(screen.getByText("₹20,000.00")).toBeInTheDocument(); // Received
    expect(screen.getByText("₹16,000.00")).toBeInTheDocument(); // Held
    expect(screen.getByText("₹3,000.00")).toBeInTheDocument(); // Deducted
    expect(screen.getByText("₹1,000.00")).toBeInTheDocument(); // Refunded
  });

  it("shows the Pending and Partially Received status tags correctly", () => {
    const { rerender } = render(<DepositTable deposits={[makeDeposit({ status: "PENDING", received_amount: 0, held: 0 })]} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();

    rerender(<DepositTable deposits={[makeDeposit({ status: "PARTIALLY_RECEIVED", received_amount: 10000, held: 10000 })]} />);
    expect(screen.getByText("Partially Received")).toBeInTheDocument();
  });

  it("renders a deposit with Held = 0 as a real row (zero-held is not the empty state)", () => {
    render(<DepositTable deposits={[makeDeposit({ status: "RECEIVED", held: 0, deducted_amount: 20000 })]} />);

    expect(screen.getByRole("link", { name: "DEP-01" })).toBeInTheDocument();
    expect(screen.getByText("Received", { selector: "span" })).toBeInTheDocument();
    // Held column shows a real zero, not an absence.
    const heldCells = screen.getAllByText("₹0.00");
    expect(heldCells.length).toBeGreaterThan(0);
  });

  it("shows a dash when the deposit has no tenant or lease/unit/property linked", () => {
    render(<DepositTable deposits={[makeDeposit({ tenants: null, leases: null })]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders nothing in the body when there are no deposits (caller handles the empty state)", () => {
    render(<DepositTable deposits={[]} />);
    expect(screen.queryAllByRole("row")).toHaveLength(1); // header row only
  });
});
