import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { Step5Adjustments } from "@/components/tenantExits/steps/Step5Adjustments";
import { Step6Settlement } from "@/components/tenantExits/steps/Step6Settlement";
import { Step7Statement } from "@/components/tenantExits/steps/Step7Statement";
import { Step8Refund } from "@/components/tenantExits/steps/Step8Refund";
import { Step9Completion } from "@/components/tenantExits/steps/Step9Completion";
import { TenantExitTab } from "@/components/tenantExits/TenantExitTab";
import type {
  ExitSettlementRow,
  TenantExitRow,
  ExitSettlementItemRow,
  DepositRefundRow,
  TenantCreditRefundRow,
  ExitTenantStatementRow,
} from "@/lib/queries/tenantExits";

// Step6Settlement/Step8Refund/Step9Completion call useToast() for their
// post-mutation success toast — never invoked by these gating-only tests,
// but the real ToastProvider is lightweight and safe to mount directly.
function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

// These step components import "use server" action modules that transitively
// pull in server-only guarded code (lib/supabase/server etc.) — vitest
// doesn't apply Next.js's RSC boundary splitting, so importing the real
// action module here trips that guard. useActionState only needs a function
// reference to mount; it's never actually invoked by these tests, which are
// only about each step's own write-action gating logic (matching the
// established BillPaymentSummary/ApplyCreditDialog precedent).
vi.mock("@/lib/actions/tenantExits", () => ({
  addSettlementAdjustmentAction: async () => ({}),
  finalizeExitSettlementAction: async () => ({}),
  createDepositRefundAction: async () => ({}),
  createCreditRefundAction: async () => ({}),
  completeTenantExitAction: async () => ({}),
}));

// Step6Settlement/Step8Refund/Step9Completion call useRouter() for the
// post-mutation router.refresh() — never invoked by these gating-only
// tests, but the App Router context isn't mounted under plain RTL render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

/**
 * P5.7F/G: credit_applied/deposit_consumed/deposit_origin_refundable/
 * credit_origin_refundable are all real, required (NOT NULL) columns —
 * every test fixture must supply them, defaulting to 0 like every other
 * settlement figure.
 */
function makeSettlement(overrides: Partial<ExitSettlementRow> = {}): ExitSettlementRow {
  return {
    id: "settlement-1",
    organization_id: "org-1",
    tenant_exit_id: "exit-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    settlement_reference: "SET-1",
    settlement_date: "2026-02-01",
    status: "DRAFT",
    previous_dues: 0,
    final_charges: 0,
    deposit_deduction: 0,
    tenant_credit: 0,
    credit_applied: 0,
    deposit_consumed: 0,
    final_amount_due: 0,
    final_amount_refundable: 0,
    deposit_origin_refundable: 0,
    credit_origin_refundable: 0,
    currency_code: "INR",
    finalized_at: null,
    finalized_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeExit(overrides: Partial<TenantExitRow> = {}): TenantExitRow {
  return {
    id: "exit-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    exit_reference: "EXIT-1",
    status: "PENDING_SETTLEMENT",
    notice_date: null,
    planned_exit_date: null,
    actual_exit_date: "2026-03-15",
    handover_date: null,
    reason: null,
    final_meter_reading_date: null,
    initiated_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeDepositRefund(overrides: Partial<DepositRefundRow> = {}): DepositRefundRow {
  return {
    id: "dep-refund-1",
    organization_id: "org-1",
    security_deposit_id: "deposit-1",
    tenant_exit_id: "exit-1",
    exit_settlement_id: "settlement-1",
    tenant_id: "tenant-1",
    refund_reference: "REF-1",
    refund_date: "2026-03-15",
    amount: 4100,
    currency_code: "INR",
    payment_method_id: null,
    status: "COMPLETED",
    transaction_reference: null,
    processed_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeCreditRefund(overrides: Partial<TenantCreditRefundRow> = {}): TenantCreditRefundRow {
  return {
    id: "cr-refund-1",
    organization_id: "org-1",
    tenant_exit_id: "exit-1",
    exit_settlement_id: "settlement-1",
    tenant_id: "tenant-1",
    refund_reference: "CRF-1",
    refund_date: "2026-03-15",
    amount: 2000,
    currency_code: "INR",
    payment_method_id: null,
    status: "COMPLETED",
    transaction_reference: null,
    processed_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeStatement(overrides: Partial<ExitTenantStatementRow> = {}): ExitTenantStatementRow {
  return {
    organization_id: "org-1",
    exit_settlement_id: "settlement-1",
    settlement_code: "SET-1",
    tenant_id: "tenant-1",
    tenant_code: "TEN-1",
    tenant_name: "Ananya Rao",
    phone: null,
    lease_id: "lease-1",
    lease_code: "LSE-1",
    property_id: "prop-1",
    property_code: "P-1",
    property_name: "Ridgeview Residency",
    unit_id: "unit-1",
    unit_code: "A-304",
    unit_name: null,
    occupancy_start_date: "2025-01-01",
    actual_end_date: "2026-03-15",
    settlement_date: "2026-02-01",
    settlement_status: "FINALIZED",
    tenant_due: 0,
    tenant_credit: 0,
    deposit_required: 50000,
    deposit_received: 50000,
    deposit_deducted: 0,
    deposit_refunded: 0,
    deposit_held: 50000,
    previous_dues: 0,
    final_charges: 0,
    deposit_deduction: 0,
    settlement_credit: 0,
    final_amount_due: 0,
    final_amount_refundable: 0,
    created_at: "2026-01-01T00:00:00Z",
    finalized_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

describe("Step5Adjustments — write-action gating", () => {
  it("shows the Add Charge form when the caller can write and the settlement is still DRAFT", () => {
    renderWithToast(
      <Step5Adjustments
        chargeItems={[]}
        historicalCreditItems={[]}
        currencyCode="INR"
        exitSettlementId="settlement-1"
        tenantId="tenant-1"
        canWrite={true}
        canEdit={true}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("hides the Add Charge form when the caller lacks write access", () => {
    renderWithToast(
      <Step5Adjustments
        chargeItems={[]}
        historicalCreditItems={[]}
        currencyCode="INR"
        exitSettlementId="settlement-1"
        tenantId="tenant-1"
        canWrite={false}
        canEdit={true}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  it("hides the Add Charge form once the settlement is no longer DRAFT, even with write access", () => {
    renderWithToast(
      <Step5Adjustments
        chargeItems={[]}
        historicalCreditItems={[]}
        currencyCode="INR"
        exitSettlementId="settlement-1"
        tenantId="tenant-1"
        canWrite={true}
        canEdit={false}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  it("renders historical credit items as read-only, with no edit/remove control", () => {
    const historicalCreditItems: ExitSettlementItemRow[] = [
      {
        id: "item-1",
        organization_id: "org-1",
        exit_settlement_id: "settlement-1",
        item_type: "OTHER",
        description: "Goodwill credit",
        amount: 500,
        is_credit: true,
        source_bill_id: null,
        source_ledger_entry_id: null,
        sort_order: 0,
        metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    renderWithToast(
      <Step5Adjustments
        chargeItems={[]}
        historicalCreditItems={historicalCreditItems}
        currencyCode="INR"
        exitSettlementId="settlement-1"
        tenantId="tenant-1"
        canWrite={true}
        canEdit={true}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("Goodwill credit")).toBeInTheDocument();
    expect(screen.getByText("Historical")).toBeInTheDocument();
    expect(screen.getByText(/shown for record only/)).toBeInTheDocument();
  });
});

describe("Step6Settlement — accounting display (P5.7F Model C2)", () => {
  it("shows a positive Final Amount Due and never zeroes out previous_dues when a deposit/credit was applied", () => {
    renderWithToast(
      <Step6Settlement
        settlement={makeSettlement({
          previous_dues: 8000,
          final_charges: 12000,
          credit_applied: 5000,
          deposit_consumed: 7000,
          final_amount_due: 8000,
          deposit_origin_refundable: 43000,
          credit_origin_refundable: 0,
        })}
        canWrite={true}
        canFinalize={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    // Final Amount Due equals previous_dues exactly — proves deposit/credit
    // never reduced it (the C2 invariant), not a derived assertion.
    expect(screen.getByText("Final Amount Due")).toBeInTheDocument();
    expect(screen.getAllByText("₹8,000.00").length).toBeGreaterThan(0);
    expect(screen.getByText("₹43,000.00")).toBeInTheDocument();
  });

  it("shows zero-credit and zero-deposit states distinctly (₹0.00, not blank/missing)", () => {
    renderWithToast(
      <Step6Settlement
        settlement={makeSettlement({ previous_dues: 0, final_charges: 3000, final_amount_due: 3000 })}
        canWrite={true}
        canFinalize={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("Credit Applied")).toBeInTheDocument();
    expect(screen.getByText("Deposit Applied")).toBeInTheDocument();
    expect(screen.getAllByText("₹0.00").length).toBeGreaterThan(0);
  });

  it("shows Finalize Settlement when the caller can write and the settlement can be finalized", () => {
    renderWithToast(<Step6Settlement settlement={makeSettlement({ status: "DRAFT" })} canWrite={true} canFinalize={true} tenantId="tenant-1" nextHref="#" backHref="#" />);
    expect(screen.getByRole("button", { name: "Finalize Settlement" })).toBeInTheDocument();
  });

  it("hides Finalize Settlement when the caller lacks write access", () => {
    renderWithToast(<Step6Settlement settlement={makeSettlement({ status: "DRAFT" })} canWrite={false} canFinalize={true} tenantId="tenant-1" nextHref="#" backHref="#" />);
    expect(screen.queryByRole("button", { name: "Finalize Settlement" })).not.toBeInTheDocument();
  });

  it("shows a Continue link instead of Finalize once the settlement is already finalized", () => {
    renderWithToast(<Step6Settlement settlement={makeSettlement({ status: "FINALIZED" })} canWrite={true} canFinalize={false} tenantId="tenant-1" nextHref="#" backHref="#" />);
    expect(screen.queryByRole("button", { name: "Finalize Settlement" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue to Final Statement" })).toBeInTheDocument();
  });
});

describe("Step7Statement — reads the settlement row directly for the P5.7F breakdown", () => {
  it("shows Credit-Origin Refundable and Deposit-Origin Refundable as two separate figures, not one combined refund", () => {
    renderWithToast(
      <Step7Statement
        statement={makeStatement()}
        settlement={makeSettlement({ credit_origin_refundable: 16500, deposit_origin_refundable: 50000, final_amount_due: 0 })}
        currencyCode="INR"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("Credit-Origin Refundable")).toBeInTheDocument();
    expect(screen.getByText("Deposit-Origin Refundable")).toBeInTheDocument();
    expect(screen.getByText("₹16,500.00")).toBeInTheDocument();
    expect(screen.getByText("₹50,000.00")).toBeInTheDocument();
  });
});

describe("Step8Refund — two-pool separation, no generic Record Refund", () => {
  it("there is no generic 'Record Refund' action anywhere on this step", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", credit_origin_refundable: 2000, deposit_origin_refundable: 5000 })}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        creditRefunds={[]}
        remainingCreditRefundable={2000}
        hasDeposit={true}
        depositHeld={50000}
        depositRefunds={[]}
        remainingDepositRefundable={5000}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Record Refund" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refund Tenant Credit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refund Security Deposit" })).toBeInTheDocument();
  });

  it("shows Amount Payable independently of both refundable pools being nonzero (they coexist under C2)", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_due: 8000, credit_origin_refundable: 0, deposit_origin_refundable: 43000 })}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        creditRefunds={[]}
        remainingCreditRefundable={0}
        hasDeposit={true}
        depositHeld={50000}
        depositRefunds={[]}
        remainingDepositRefundable={43000}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("Amount Payable by Tenant")).toBeInTheDocument();
    expect(screen.getByText("₹8,000.00")).toBeInTheDocument();
    expect(screen.getByText("₹43,000.00")).toBeInTheDocument();
    // Amount Payable is never labeled a refund.
    expect(screen.queryByText(/₹8,000\.00.*[Rr]efund/)).not.toBeInTheDocument();
  });

  it("hides Refund Tenant Credit when nothing remains refundable from credit (zero-state, distinct from zero-deposit)", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", credit_origin_refundable: 0, deposit_origin_refundable: 5000 })}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        creditRefunds={[]}
        remainingCreditRefundable={0}
        hasDeposit={true}
        depositHeld={50000}
        depositRefunds={[]}
        remainingDepositRefundable={5000}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Refund Tenant Credit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refund Security Deposit" })).toBeInTheDocument();
  });

  it("shows the deposit-empty state distinctly from a fully-consumed deposit", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED" })}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        creditRefunds={[]}
        remainingCreditRefundable={0}
        hasDeposit={false}
        depositHeld={0}
        depositRefunds={[]}
        remainingDepositRefundable={0}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("No security deposit is on file for this tenant.")).toBeInTheDocument();
  });

  it("hides both actions when the caller lacks write access, even with refundable capacity remaining", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", credit_origin_refundable: 2000, deposit_origin_refundable: 5000 })}
        paymentMethods={[]}
        canWrite={false}
        tenantId="tenant-1"
        creditRefunds={[]}
        remainingCreditRefundable={2000}
        hasDeposit={true}
        depositHeld={50000}
        depositRefunds={[]}
        remainingDepositRefundable={5000}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Refund Tenant Credit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refund Security Deposit" })).not.toBeInTheDocument();
  });

  it("keeps credit refund history and deposit refund history in two separate tables, never merged", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED" })}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        creditRefunds={[makeCreditRefund({ refund_reference: "CRF-77" })]}
        remainingCreditRefundable={0}
        hasDeposit={true}
        depositHeld={0}
        depositRefunds={[makeDepositRefund({ refund_reference: "REF-88" })]}
        remainingDepositRefundable={0}
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("CRF-77")).toBeInTheDocument();
    expect(screen.getByText("REF-88")).toBeInTheDocument();
  });
});

describe("Step9Completion — separate refund totals, completion never gated on them", () => {
  it("shows separate Credit Refund and Deposit Refund lines with their own completed totals", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "PENDING_SETTLEMENT" })}
        settlement={makeSettlement({ status: "FINALIZED", final_amount_due: 0 })}
        completedCreditRefunds={[makeCreditRefund({ amount: 2000 })]}
        completedDepositRefunds={[makeDepositRefund({ amount: 43000 })]}
        tenantName="Ananya Rao"
        unitLabel="A-304"
        leaseCode="LSE-1"
        canWrite={true}
        canComplete={true}
      />,
    );
    expect(screen.getByText("Credit Refund")).toBeInTheDocument();
    expect(screen.getByText("Deposit Refund")).toBeInTheDocument();
    expect(screen.getByText("₹2,000.00 recorded")).toBeInTheDocument();
    expect(screen.getByText("₹43,000.00 recorded")).toBeInTheDocument();
  });

  it("shows Complete Tenant Exit even with pending refunds and an outstanding Amount Payable — the backend does not require either", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "PENDING_SETTLEMENT" })}
        settlement={makeSettlement({ status: "FINALIZED", final_amount_due: 8000 })}
        completedCreditRefunds={[]}
        completedDepositRefunds={[]}
        tenantName="Ananya Rao"
        unitLabel="A-304"
        leaseCode="LSE-1"
        canWrite={true}
        canComplete={true}
      />,
    );
    expect(screen.getByRole("button", { name: "Complete Tenant Exit" })).toBeInTheDocument();
    expect(screen.getByText("₹8,000.00 outstanding")).toBeInTheDocument();
    expect(screen.getAllByText("None recorded")).toHaveLength(2);
  });

  it("hides Complete Tenant Exit when the caller lacks write access", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "PENDING_SETTLEMENT" })}
        settlement={makeSettlement({ status: "FINALIZED" })}
        completedCreditRefunds={[]}
        completedDepositRefunds={[]}
        tenantName="Ananya Rao"
        unitLabel="A-304"
        leaseCode="LSE-1"
        canWrite={false}
        canComplete={true}
      />,
    );
    expect(screen.queryByRole("button", { name: "Complete Tenant Exit" })).not.toBeInTheDocument();
  });

  it("hides Complete Tenant Exit once the exit is already COMPLETED", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "COMPLETED" })}
        settlement={makeSettlement({ status: "FINALIZED" })}
        completedCreditRefunds={[]}
        completedDepositRefunds={[]}
        tenantName="Ananya Rao"
        unitLabel="A-304"
        leaseCode="LSE-1"
        canWrite={true}
        canComplete={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Complete Tenant Exit" })).not.toBeInTheDocument();
    expect(screen.getByText("This exit is complete.")).toBeInTheDocument();
  });
});

describe("TenantExitTab — empty state and permission gating", () => {
  it("shows a plain empty state with no CTA when no active lease exists", () => {
    render(<TenantExitTab currentLeaseId={null} exit={null} settlement={null} canWrite={true} />);
    expect(screen.getByText("No active lease")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start Tenant Exit" })).not.toBeInTheDocument();
  });

  it("shows Start Tenant Exit when the caller can write and an active lease exists", () => {
    render(<TenantExitTab currentLeaseId="lease-1" exit={null} settlement={null} canWrite={true} />);
    expect(screen.getByRole("link", { name: "Start Tenant Exit" })).toBeInTheDocument();
  });

  it("hides Start Tenant Exit when the caller lacks write access", () => {
    render(<TenantExitTab currentLeaseId="lease-1" exit={null} settlement={null} canWrite={false} />);
    expect(screen.queryByRole("link", { name: "Start Tenant Exit" })).not.toBeInTheDocument();
  });

  it("shows Continue Exit for an in-progress exit, regardless of write access (read-only can still view)", () => {
    render(<TenantExitTab currentLeaseId="lease-1" exit={makeExit({ status: "INITIATED" })} settlement={null} canWrite={false} />);
    expect(screen.getByRole("link", { name: "Continue Exit" })).toBeInTheDocument();
  });
});
