import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentPaymentsTable } from "@/components/dashboard/RecentPaymentsTable";
import type { PaymentListItem } from "@/lib/queries/payments";

function makePayment(overrides: Partial<PaymentListItem>): PaymentListItem {
  return {
    id: "pay-1",
    organization_id: "org-a",
    tenant_id: "tenant-1",
    payment_method_id: "method-1",
    payment_number: "PMT-0001",
    payment_date: "2026-08-15",
    amount: 32000,
    currency_code: "INR",
    status: "POSTED",
    reference_number: null,
    bank_name: null,
    cheque_number: null,
    transaction_reference: null,
    notes: null,
    metadata: {},
    created_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
    tenants: { id: "tenant-1", display_name: "Ananya Rao", tenant_code: "TEN-01" },
    payment_methods: { name: "UPI" },
    ...overrides,
  } as PaymentListItem;
}

describe("RecentPaymentsTable", () => {
  it("shows 'Nothing here yet' when there are no payments", () => {
    render(<RecentPaymentsTable payments={[]} />);

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders tenant, method, amount, date, and status straight from the existing payments query — no invented columns", () => {
    render(<RecentPaymentsTable payments={[makePayment({})]} />);

    expect(screen.getByText("Ananya Rao")).toBeInTheDocument();
    expect(screen.getByText("UPI")).toBeInTheDocument();
    expect(screen.getByText("₹32,000.00")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
  });

  it("renders a reversed payment with its own real status, not a fabricated one", () => {
    render(<RecentPaymentsTable payments={[makePayment({ status: "REVERSED" })]} />);

    expect(screen.getByText("Reversed")).toBeInTheDocument();
  });
});
