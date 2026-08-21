import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GeneratedBillItemsTable } from "@/components/meters/GeneratedBillItemsTable";
import type { GeneratedUtilityBillItem } from "@/lib/queries/meterReadings";

function makeItem(overrides: Partial<GeneratedUtilityBillItem>): GeneratedUtilityBillItem {
  return {
    id: "item-1",
    organization_id: "org-1",
    bill_id: "bill-1",
    item_type: "UTILITY",
    description: "Electricity",
    utility_id: "util-1",
    meter_id: "meter-1",
    quantity: 45,
    unit_name: "kWh",
    unit_rate: 8,
    amount: 360,
    tax_amount: 0,
    discount_amount: 0,
    sort_order: 0,
    metadata: {},
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    bills: { id: "bill-1", bill_number: "INV-20260701-9C2E", period_start: "2026-06-01", period_end: "2026-06-30" },
    ...overrides,
  };
}

describe("GeneratedBillItemsTable — billing connection rendering", () => {
  it("renders the bill, period, consumption, rate, and amount straight from the stored bill_item row", () => {
    render(<GeneratedBillItemsTable items={[makeItem({})]} />);

    expect(screen.getByRole("link", { name: "INV-20260701-9C2E" })).toHaveAttribute("href", "/app/billing/bills/bill-1");
    expect(screen.getByText("2026-06-01 – 2026-06-30")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("₹8.00")).toBeInTheDocument();
    expect(screen.getByText("₹360.00")).toBeInTheDocument();
  });

  it("shows a dash for a FIXED utility item with no meter-derived quantity/rate", () => {
    render(<GeneratedBillItemsTable items={[makeItem({ quantity: 1, unit_rate: null, meter_id: null })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders nothing in the body when the meter has no generated bill items yet", () => {
    render(<GeneratedBillItemsTable items={[]} />);
    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});
