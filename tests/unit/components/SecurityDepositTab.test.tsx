import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SecurityDepositTab } from "@/components/securityDeposits/SecurityDepositTab";
import { DepositTransactionTable } from "@/components/securityDeposits/DepositTransactionTable";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";

// Both dialogs are "use client" components that transitively import a
// "use server" action module — vitest doesn't apply Next.js's RSC boundary
// splitting, so rendering the real thing here trips the server-only guard.
// These tests are only about SecurityDepositTab's own gating/empty-state
// logic (does it render the trigger at all), not the dialogs' internal
// behavior (covered by the live E2E suite, matching the BillPaymentSummary/
// ApplyCreditDialog precedent).
vi.mock("@/components/securityDeposits/RecordDepositReceiptDialog", () => ({
  RecordDepositReceiptDialog: () => <button type="button">Record Receipt</button>,
}));
vi.mock("@/components/securityDeposits/RecordDepositDeductionDialog", () => ({
  RecordDepositDeductionDialog: () => <button type="button">Record Deduction</button>,
}));

function makeDeposit(overrides: Partial<SecurityDepositRow> = {}): SecurityDepositRow {
  return {
    id: "deposit-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    lease_id: "lease-1",
    deposit_reference: "DEP-001",
    required_amount: 50000,
    received_amount: 50000,
    deducted_amount: 0,
    refunded_amount: 0,
    outstanding_amount: 0,
    status: "RECEIVED",
    currency_code: "INR",
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<SecurityDepositTransactionRow> = {}): SecurityDepositTransactionRow {
  return {
    id: "tx-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    lease_id: "lease-1",
    security_deposit_id: "deposit-1",
    transaction_type: "RECEIPT",
    amount: 50000,
    currency_code: "INR",
    transaction_date: "2026-01-01",
    description: "Deposit received in full",
    reference_code: null,
    payment_id: null,
    exit_settlement_id: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    created_by: "user-1",
    ...overrides,
  };
}

describe("SecurityDepositTab — empty state", () => {
  it("shows a plain empty state with no CTA when no deposit exists and the caller lacks write access", () => {
    render(
      <SecurityDepositTab deposit={null} held={0} transactions={[]} canWrite={false} tenantId="tenant-1" leaseId="lease-1" />,
    );
    expect(screen.getByText("No security deposit configured")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Receipt" })).not.toBeInTheDocument();
  });

  it("shows a Record Receipt CTA when no deposit exists, the caller can write, and a lease exists", () => {
    render(
      <SecurityDepositTab deposit={null} held={0} transactions={[]} canWrite={true} tenantId="tenant-1" leaseId="lease-1" />,
    );
    expect(screen.getByText("No security deposit configured")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Receipt" })).toBeInTheDocument();
  });

  it("hides the CTA when the caller can write but there is no active lease to attach a deposit to", () => {
    render(
      <SecurityDepositTab deposit={null} held={0} transactions={[]} canWrite={true} tenantId="tenant-1" leaseId={null} />,
    );
    expect(screen.getByText("No security deposit configured")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Receipt" })).not.toBeInTheDocument();
  });

  it("distinguishes a deposit that exists with zero held balance from no deposit at all", () => {
    render(
      <SecurityDepositTab
        deposit={makeDeposit({ received_amount: 0, deducted_amount: 0, status: "PENDING" })}
        held={0}
        transactions={[]}
        canWrite={true}
        tenantId="tenant-1"
        leaseId="lease-1"
      />,
    );
    expect(screen.queryByText("No security deposit configured")).not.toBeInTheDocument();
    expect(screen.getByText("Held", { exact: true })).toBeInTheDocument();
  });
});

describe("SecurityDepositTab — write-action gating on an existing deposit", () => {
  it("shows Record Receipt and Record Deduction when the caller can write", () => {
    render(
      <SecurityDepositTab
        deposit={makeDeposit()}
        held={50000}
        transactions={[]}
        canWrite={true}
        tenantId="tenant-1"
        leaseId="lease-1"
      />,
    );
    expect(screen.getByRole("button", { name: "Record Receipt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Deduction" })).toBeInTheDocument();
  });

  it("hides both write actions when the caller lacks write access", () => {
    render(
      <SecurityDepositTab
        deposit={makeDeposit()}
        held={50000}
        transactions={[]}
        canWrite={false}
        tenantId="tenant-1"
        leaseId="lease-1"
      />,
    );
    expect(screen.queryByRole("button", { name: "Record Receipt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Deduction" })).not.toBeInTheDocument();
  });

  it("never renders any Refund action, regardless of write access", () => {
    render(
      <SecurityDepositTab
        deposit={makeDeposit()}
        held={50000}
        transactions={[makeTransaction({ id: "tx-refund", transaction_type: "REFUND", amount: 10000, description: "Exit refund" })]}
        canWrite={true}
        tenantId="tenant-1"
        leaseId="lease-1"
      />,
    );
    expect(screen.queryByRole("button", { name: /Refund/i })).not.toBeInTheDocument();
  });
});

describe("DepositTransactionTable", () => {
  it("renders Date/Type/Description/Reference/Amount columns in backend order, without resorting", () => {
    const transactions = [
      makeTransaction({ id: "tx-1", transaction_type: "RECEIPT", description: "Deposit received in full", amount: 50000 }),
      makeTransaction({
        id: "tx-2",
        transaction_type: "DEDUCTION",
        description: "Cleaning charge",
        amount: 5000,
        transaction_date: "2026-02-01",
      }),
    ];
    render(<DepositTransactionTable transactions={transactions} />);

    const headers = screen.getAllByRole("columnheader").map((cell) => cell.textContent);
    expect(headers).toEqual(["Date", "Type", "Description", "Reference", "Amount"]);

    const rows = screen.getAllByRole("row").slice(1); // drop header row
    expect(rows[0]).toHaveTextContent("Deposit received in full");
    expect(rows[1]).toHaveTextContent("Cleaning charge");
  });

  it("renders a REFUND transaction as a plain read-only row with no action affordance", () => {
    render(
      <DepositTransactionTable
        transactions={[
          makeTransaction({ id: "tx-refund", transaction_type: "REFUND", description: "Exit refund", amount: 45000, reference_code: "EXIT-001" }),
        ]}
      />,
    );
    expect(screen.getByText("Refund")).toBeInTheDocument();
    expect(screen.getByText("Exit refund")).toBeInTheDocument();
    expect(screen.getByText("EXIT-001")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a dash for a transaction with no reference code", () => {
    render(<DepositTransactionTable transactions={[makeTransaction({ reference_code: null })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
