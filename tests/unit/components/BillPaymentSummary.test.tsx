import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BillPaymentSummary } from "@/components/billing/BillPaymentSummary";
import type { BillDetail } from "@/lib/queries/bills";

// ApplyCreditDialog is a "use client" component that transitively imports a
// "use server" action module — vitest doesn't apply Next.js's RSC boundary
// splitting, so rendering the real thing here trips the server-only guard.
// This test is only about BillPaymentSummary's own eligibility logic (does
// it render the trigger at all), not ApplyCreditDialog's internal behavior
// (covered by the live E2E suite instead, matching how VoidBillDialog/
// FinalizeBillDialog/ReversePaymentDialog are exercised in this codebase).
vi.mock("@/components/billing/ApplyCreditDialog", () => ({
  ApplyCreditDialog: () => <button type="button">Apply Credit</button>,
}));

function makeBill(overrides: Partial<BillDetail>): BillDetail {
  return {
    id: "bill-1",
    organization_id: "org-1",
    billing_run_id: null,
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    unit_id: "unit-1",
    bill_number: "INV-20260101-TEST0001",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    bill_date: "2026-01-01",
    due_date: null,
    status: "FINALIZED",
    subtotal: 10000,
    discount_amount: 0,
    adjustment_amount: 0,
    previous_balance_amount: 0,
    total_amount: 10000,
    currency_code: "INR",
    finalized_at: "2026-01-01T00:00:00Z",
    finalized_by: "user-1",
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    tenants: { id: "tenant-1", display_name: "Asha Rao", tenant_code: "TEN-01" },
    leases: { id: "lease-1", lease_code: "LSE-01" },
    units: { id: "unit-1", unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "PROP-01" } },
    ...overrides,
  };
}

describe("BillPaymentSummary — Apply Credit eligibility", () => {
  it("shows Apply Credit for a FINALIZED bill with available credit and an outstanding balance", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "FINALIZED" })}
        paidAmount={0}
        outstanding={10000}
        creditApplied={0}
        availableCredit={5000}
        canWrite={true}
      />,
    );
    expect(screen.getByRole("button", { name: /Apply Credit/ })).toBeInTheDocument();
  });

  it("shows Apply Credit for a PARTIALLY_PAID bill with available credit and an outstanding balance", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "PARTIALLY_PAID" })}
        paidAmount={4000}
        outstanding={6000}
        creditApplied={0}
        availableCredit={2000}
        canWrite={true}
      />,
    );
    expect(screen.getByRole("button", { name: /Apply Credit/ })).toBeInTheDocument();
  });

  it("hides Apply Credit for a DRAFT bill", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "DRAFT" })}
        paidAmount={0}
        outstanding={0}
        creditApplied={0}
        availableCredit={5000}
        canWrite={true}
      />,
    );
    expect(screen.queryByRole("button", { name: /Apply Credit/ })).not.toBeInTheDocument();
  });

  it("hides Apply Credit for a PAID bill", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "PAID" })}
        paidAmount={10000}
        outstanding={0}
        creditApplied={0}
        availableCredit={5000}
        canWrite={true}
      />,
    );
    expect(screen.queryByRole("button", { name: /Apply Credit/ })).not.toBeInTheDocument();
  });

  it("hides Apply Credit for a VOID bill", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "VOID" })}
        paidAmount={0}
        outstanding={0}
        creditApplied={0}
        availableCredit={5000}
        canWrite={true}
      />,
    );
    expect(screen.queryByRole("button", { name: /Apply Credit/ })).not.toBeInTheDocument();
  });

  it("hides Apply Credit when there is no available credit", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "FINALIZED" })}
        paidAmount={0}
        outstanding={10000}
        creditApplied={0}
        availableCredit={0}
        canWrite={true}
      />,
    );
    expect(screen.queryByRole("button", { name: /Apply Credit/ })).not.toBeInTheDocument();
  });

  it("hides Apply Credit when the caller lacks write access, even if otherwise eligible", () => {
    render(
      <BillPaymentSummary
        bill={makeBill({ status: "FINALIZED" })}
        paidAmount={0}
        outstanding={10000}
        creditApplied={0}
        availableCredit={5000}
        canWrite={false}
      />,
    );
    expect(screen.queryByRole("button", { name: /Apply Credit/ })).not.toBeInTheDocument();
  });
});
