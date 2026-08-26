import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/Toast";
import { UnitOccupancyTabs } from "@/components/units/UnitOccupancyTabs";
import type { RentRuleRow } from "@/lib/queries/rentRules";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";
import type { LeaseRow } from "@/lib/queries/leases";
import type { BillListItem } from "@/lib/queries/bills";
import type { LedgerEntryRow } from "@/lib/queries/ledger";

// The Rent/Billing/Deposit write-action drawers embedded in these panels
// import "use server" action modules that transitively pull in server-only
// guarded code — vitest doesn't apply Next.js's RSC boundary splitting, so
// importing the real action modules here trips that guard. These tests are
// only about the tab wiring (which occupancy each panel is scoped to,
// which tab shows which content), never about submitting these forms —
// same precedent as TenantExitWizardSteps.test.tsx.
vi.mock("@/lib/actions/rentRules", () => ({ createRentRuleAction: async () => ({}) }));
vi.mock("@/lib/actions/billingConfigs", () => ({ createBillingConfigAction: async () => ({}) }));
vi.mock("@/lib/actions/securityDeposits", () => ({
  recordDepositReceiptAction: async () => ({}),
  recordDepositDeductionAction: async () => ({}),
}));
vi.mock("@/lib/actions/occupancy", () => ({ updateOccupancyAction: async () => ({}) }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function makeRentRule(overrides: Partial<RentRuleRow> = {}): RentRuleRow {
  return {
    id: "rule-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    rule_name: "Base Rent",
    monthly_rent: 20000,
    effective_from: "2026-01-01",
    effective_to: null,
    is_active: true,
    auto_apply: true,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeBillingConfig(overrides: Partial<BillingConfigRow> = {}): BillingConfigRow {
  return {
    id: "config-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    billing_frequency: "MONTHLY",
    billing_day: 1,
    billing_anchor_month: null,
    proration_method: "CALENDAR_DAYS",
    due_days_after_bill: 0,
    first_bill_prorate: false,
    final_bill_prorate: false,
    bill_in_advance: false,
    effective_from: "2026-01-01",
    effective_to: null,
    is_active: true,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLease(overrides: Partial<LeaseRow> = {}): LeaseRow {
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
    ...overrides,
  };
}

function makeBill(overrides: Partial<BillListItem> = {}): BillListItem {
  return {
    id: "bill-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    lease_id: "lease-1",
    unit_id: "unit-1",
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

function makeLedgerEntry(overrides: Partial<LedgerEntryRow> = {}): LedgerEntryRow {
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

function renderTabs(overrides: Partial<Parameters<typeof UnitOccupancyTabs>[0]> = {}) {
  return renderWithToast(
    <UnitOccupancyTabs
      leaseId="lease-1"
      unitId="unit-1"
      tenantId="tenant-1"
      lease={makeLease()}
      rentRules={[makeRentRule()]}
      billingConfigs={[makeBillingConfig()]}
      deposit={null}
      depositHeld={0}
      depositTransactions={[]}
      tenantExit={null}
      exitSettlement={null}
      canWrite={true}
      {...overrides}
    />,
  );
}

describe("UnitOccupancyTabs — P6.3-D Part 3: Rent/Billing/Deposit/Exit reached from Unit Detail, scoped to one occupancy", () => {
  it("defaults to the Occupancy tab", () => {
    renderTabs();

    expect(screen.getByText("Occupancy Status")).toBeInTheDocument();
  });

  it("switches to Rent and shows this occupancy's rent history", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Rent" }));

    expect(screen.getByText("Base Rent")).toBeInTheDocument();
    expect(screen.getByText("20000")).toBeInTheDocument();
  });

  it("switches to Billing and shows this occupancy's billing configuration", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Billing" }));

    expect(screen.getByRole("cell", { name: "Monthly" })).toBeInTheDocument();
  });

  it("switches to Deposit and shows the no-deposit-yet state scoped to this occupancy", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Deposit" }));

    expect(screen.getByText("No security deposit configured")).toBeInTheDocument();
  });

  it("switches to Exit and shows the Start Tenant Exit action for this occupancy's lease id", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Exit" }));

    const startLink = screen.getByRole("link", { name: "Start Tenant Exit" });
    expect(startLink).toHaveAttribute("href", "/app/exits/new?leaseId=lease-1");
  });

  it("hides write actions (Add Rent Rule, Add Billing Configuration) for a read-only caller", () => {
    renderTabs({ canWrite: false });

    expect(screen.queryByRole("button", { name: "Add Rent Rule" })).not.toBeInTheDocument();
  });
});

describe("UnitOccupancyTabs — P6.3-F: the Occupancy tab replaces /app/leases/[id]/edit", () => {
  it("shows the approved editable/display fields, never the lease code or currency", () => {
    renderTabs({
      lease: makeLease({
        occupancy_start_date: "2026-01-01",
        notice_date: "2026-06-01",
        move_in_date: "2026-01-02",
        agreement_end_date: "2026-12-31",
        notes: "Prefers email contact.",
      }),
    });

    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByText("2026-06-01")).toBeInTheDocument();
    expect(screen.getByText("2026-01-02")).toBeInTheDocument();
    expect(screen.getByText("2026-12-31")).toBeInTheDocument();
    // The Edit Occupancy drawer's own (closed) textarea also carries this
    // text as its defaultValue — scope to the read-only summary's <span>.
    expect(screen.getByText("Prefers email contact.", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByText("LSE-01")).not.toBeInTheDocument();
    expect(screen.queryByText("INR")).not.toBeInTheDocument();
  });

  it("shows the Edit Occupancy action for a write-access caller", () => {
    renderTabs({ canWrite: true });

    expect(screen.getByRole("button", { name: "Edit Occupancy" })).toBeInTheDocument();
  });

  it("hides the Edit Occupancy action for a read-only caller", () => {
    renderTabs({ canWrite: false });

    expect(screen.queryByRole("button", { name: "Edit Occupancy" })).not.toBeInTheDocument();
  });
});

describe("UnitOccupancyTabs — P6.3-J: Bills/Ledger tabs are opt-in, for the historical occupancy page", () => {
  it("shows no Bills or Ledger tab when bills/ledgerEntries are omitted (unchanged current-occupancy Unit Detail behavior)", () => {
    renderTabs();

    expect(screen.queryByRole("tab", { name: "Bills" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Ledger" })).not.toBeInTheDocument();
  });

  it("shows a Bills tab with this occupancy's bills when supplied", async () => {
    const user = userEvent.setup();
    renderTabs({ bills: [makeBill()] });

    const tab = screen.getByRole("tab", { name: "Bills" });
    expect(tab).toBeInTheDocument();
    await user.click(tab);

    expect(screen.getByText("BILL-01")).toBeInTheDocument();
  });

  it("shows the Bills empty state when an empty array is supplied (not the same as omitting the prop)", async () => {
    const user = userEvent.setup();
    renderTabs({ bills: [] });

    await user.click(screen.getByRole("tab", { name: "Bills" }));

    expect(screen.getByText("No bills yet")).toBeInTheDocument();
  });

  it("shows a Ledger tab with this occupancy's entries when supplied", async () => {
    const user = userEvent.setup();
    renderTabs({ ledgerEntries: [makeLedgerEntry()] });

    const tab = screen.getByRole("tab", { name: "Ledger" });
    expect(tab).toBeInTheDocument();
    await user.click(tab);

    expect(screen.getByText("Bill BILL-01")).toBeInTheDocument();
  });

  it("shows the Ledger empty state when an empty array is supplied", async () => {
    const user = userEvent.setup();
    renderTabs({ ledgerEntries: [] });

    await user.click(screen.getByRole("tab", { name: "Ledger" }));

    expect(screen.getByText("No ledger entries yet")).toBeInTheDocument();
  });
});
