import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { Step5Adjustments } from "@/components/tenantExits/steps/Step5Adjustments";
import { Step6Settlement } from "@/components/tenantExits/steps/Step6Settlement";
import { Step8Refund } from "@/components/tenantExits/steps/Step8Refund";
import { Step9Completion } from "@/components/tenantExits/steps/Step9Completion";
import { TenantExitTab } from "@/components/tenantExits/TenantExitTab";
import type { ExitSettlementRow, TenantExitRow, ExitSettlementItemRow, DepositRefundRow } from "@/lib/queries/tenantExits";

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
  completeTenantExitAction: async () => ({}),
}));

// Step6Settlement/Step8Refund/Step9Completion call useRouter() for the
// post-mutation router.refresh() — never invoked by these gating-only
// tests, but the App Router context isn't mounted under plain RTL render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

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
    final_amount_due: 0,
    final_amount_refundable: 0,
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

describe("Step6Settlement — write-action gating", () => {
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

describe("Step8Refund — write-action gating and the Held-vs-Refundable separation", () => {
  it("shows Record Refund when the caller can write, a deposit exists, and refundable capacity remains", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_refundable: 5000 })}
        depositHeld={50000}
        hasDeposit={true}
        existingRefunds={[]}
        remainingRefundable={5000}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByRole("button", { name: "Record Refund" })).toBeInTheDocument();
  });

  it("hides Record Refund when the caller lacks write access", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_refundable: 5000 })}
        depositHeld={50000}
        hasDeposit={true}
        existingRefunds={[]}
        remainingRefundable={5000}
        paymentMethods={[]}
        canWrite={false}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Record Refund" })).not.toBeInTheDocument();
  });

  it("hides Record Refund once nothing remains refundable", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_refundable: 5000 })}
        depositHeld={0}
        hasDeposit={true}
        existingRefunds={[]}
        remainingRefundable={0}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.queryByRole("button", { name: "Record Refund" })).not.toBeInTheDocument();
  });

  it("never claims Security Deposit Held equals Final Amount Refundable — both figures render independently", () => {
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_refundable: 4100 })}
        depositHeld={50000}
        hasDeposit={true}
        existingRefunds={[]}
        remainingRefundable={4100}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("₹4,100.00")).toBeInTheDocument();
    expect(screen.getByText("₹50,000.00")).toBeInTheDocument();
    expect(screen.getByText(/Refund processing uses the finalized settlement amount/)).toBeInTheDocument();
  });

  it("lists an already-completed refund in the history table and hides Record Refund once fully consumed", () => {
    const existingRefunds: DepositRefundRow[] = [
      {
        id: "refund-1",
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
      },
    ];
    renderWithToast(
      <Step8Refund
        settlement={makeSettlement({ status: "FINALIZED", final_amount_refundable: 4100 })}
        depositHeld={0}
        hasDeposit={true}
        existingRefunds={existingRefunds}
        remainingRefundable={0}
        paymentMethods={[]}
        canWrite={true}
        tenantId="tenant-1"
        nextHref="#"
        backHref="#"
      />,
    );
    expect(screen.getByText("REF-1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Refund" })).not.toBeInTheDocument();
  });
});

describe("Step9Completion — write-action gating", () => {
  it("shows Complete Tenant Exit when the caller can write and the exit can be completed", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "PENDING_SETTLEMENT" })}
        settlement={makeSettlement({ status: "FINALIZED" })}
        completedRefunds={[]}
        tenantName="Ananya Rao"
        unitLabel="A-304"
        leaseCode="LSE-1"
        canWrite={true}
        canComplete={true}
      />,
    );
    expect(screen.getByRole("button", { name: "Complete Tenant Exit" })).toBeInTheDocument();
  });

  it("hides Complete Tenant Exit when the caller lacks write access", () => {
    renderWithToast(
      <Step9Completion
        exit={makeExit({ status: "PENDING_SETTLEMENT" })}
        settlement={makeSettlement({ status: "FINALIZED" })}
        completedRefunds={[]}
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
        completedRefunds={[]}
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
