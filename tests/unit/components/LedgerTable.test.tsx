import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import type { LedgerEntryRow } from "@/lib/queries/ledger";

function makeEntry(overrides: Partial<LedgerEntryRow> = {}): LedgerEntryRow {
  return {
    ledger_entry_id: "entry-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    tenant_name: "Asha Rao",
    tenant_code: "TEN-01",
    lease_id: "lease-1",
    lease_code: "LSE-01",
    bill_id: null,
    bill_number: null,
    payment_id: null,
    payment_number: null,
    entry_type: "BILL",
    entry_date: "2026-08-01",
    description: "Bill BILL-01",
    reference_code: "BILL-01",
    debit_amount: 20000,
    credit_amount: 0,
    running_balance: 20000,
    currency_code: "INR",
    is_reversal: false,
    reverses_entry_id: null,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("LedgerTable — P6.3-E: optional Unit column for a multi-unit tenant's Ledger", () => {
  it("shows no Unit column by default (unchanged for every other Ledger view)", () => {
    render(<LedgerTable entries={[makeEntry({})]} />);

    expect(screen.queryByRole("columnheader", { name: "Unit" })).not.toBeInTheDocument();
  });

  it("shows a Unit column, resolved by the entry's lease_id, when unitByLeaseId is provided", () => {
    render(
      <LedgerTable
        entries={[makeEntry({ lease_id: "lease-a" }), makeEntry({ ledger_entry_id: "entry-2", lease_id: "lease-b" })]}
        unitByLeaseId={{ "lease-a": "Shanti Nivas · A-101", "lease-b": "Shanti Nivas · B-202" }}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Unit" })).toBeInTheDocument();
    expect(screen.getByText("Shanti Nivas · A-101")).toBeInTheDocument();
    expect(screen.getByText("Shanti Nivas · B-202")).toBeInTheDocument();
  });

  it("shows a dash for an entry whose lease_id isn't in the map (e.g. a credit-only entry with no lease at all)", () => {
    render(
      <LedgerTable
        entries={[makeEntry({ lease_id: null })]}
        unitByLeaseId={{ "lease-a": "Shanti Nivas · A-101" }}
      />,
    );

    const row = screen.getByText("Bill BILL-01").closest("tr");
    expect(row).toHaveTextContent("—");
  });

  it("never renders the internal lease_id/lease_code anywhere", () => {
    render(
      <LedgerTable
        entries={[makeEntry({ lease_id: "lease-a", lease_code: "LSE-99" })]}
        unitByLeaseId={{ "lease-a": "Shanti Nivas · A-101" }}
      />,
    );

    expect(screen.queryByText("LSE-99")).not.toBeInTheDocument();
    expect(screen.queryByText("lease-a")).not.toBeInTheDocument();
  });
});
