import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TenantBillsPanel } from "@/components/tenants/TenantBillsPanel";
import type { BillListItem } from "@/lib/queries/bills";

function makeBill(overrides: Partial<BillListItem> = {}): BillListItem {
  return {
    id: "bill-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    lease_id: "lease-1",
    unit_id: "unit-a",
    bill_number: "BILL-01",
    bill_date: "2026-08-01",
    due_date: "2026-08-10",
    period_start: "2026-08-01",
    period_end: "2026-08-31",
    status: "FINALIZED",
    subtotal: 20000,
    adjustment_amount: 0,
    discount_amount: 0,
    previous_balance_amount: 0,
    total_amount: 20000,
    currency_code: "INR",
    billing_run_id: null,
    finalized_at: "2026-08-01T00:00:00Z",
    finalized_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    tenants: { id: "tenant-1", display_name: "Asha Rao", tenant_code: "TEN-01" },
    units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas" } },
    ...overrides,
  };
}

describe("TenantBillsPanel — P6.3-E: tenant-wide aggregate by default, Unit filter as an option, never duplicated data", () => {
  it("shows the empty state when the tenant has no bills at all", () => {
    render(<TenantBillsPanel bills={[]} />);

    expect(screen.getByText("No bills yet")).toBeInTheDocument();
  });

  it("shows every unit's bills together by default (All Units), with no filter control when there's only one unit", () => {
    render(<TenantBillsPanel bills={[makeBill({})]} />);

    expect(screen.getByText("BILL-01")).toBeInTheDocument();
    expect(screen.queryByLabelText("Unit")).not.toBeInTheDocument();
  });

  it("offers a Unit filter once the tenant has bills across more than one unit, defaulting to All Units", () => {
    const billA = makeBill({ id: "bill-a", unit_id: "unit-a", bill_number: "BILL-A", units: { unit_code: "A-101", properties: { id: "p1", name: "Shanti Nivas" } } });
    const billB = makeBill({ id: "bill-b", unit_id: "unit-b", bill_number: "BILL-B", units: { unit_code: "B-202", properties: { id: "p1", name: "Shanti Nivas" } } });
    render(<TenantBillsPanel bills={[billA, billB]} />);

    expect(screen.getByText("BILL-A")).toBeInTheDocument();
    expect(screen.getByText("BILL-B")).toBeInTheDocument();
    expect(screen.getByLabelText("Unit")).toBeInTheDocument();
  });

  it("filters to only the selected unit's bills, without re-fetching or duplicating any bill row", async () => {
    const user = userEvent.setup();
    const billA = makeBill({ id: "bill-a", unit_id: "unit-a", bill_number: "BILL-A", units: { unit_code: "A-101", properties: { id: "p1", name: "Shanti Nivas" } } });
    const billB = makeBill({ id: "bill-b", unit_id: "unit-b", bill_number: "BILL-B", units: { unit_code: "B-202", properties: { id: "p1", name: "Shanti Nivas" } } });
    render(<TenantBillsPanel bills={[billA, billB]} />);

    await user.selectOptions(screen.getByLabelText("Unit"), "unit-a");

    expect(screen.getByText("BILL-A")).toBeInTheDocument();
    expect(screen.queryByText("BILL-B")).not.toBeInTheDocument();
  });
});
