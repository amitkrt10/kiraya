import type { BillDetail } from "@/lib/queries/bills";
import { ApplyCreditDialog } from "./ApplyCreditDialog";
import gridStyles from "@/components/ui/ResponsiveGrid.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const CREDIT_APPLICATION_ELIGIBLE_STATUSES: BillDetail["status"][] = ["FINALIZED", "PARTIALLY_PAID"];

/**
 * Every value here is authoritative — paid comes from
 * kiraya.get_bill_paid_amount(), outstanding from kiraya.get_bill_balance(),
 * credit applied is read directly from posted CREDIT_APPLICATION ledger
 * entries against this bill, and available credit comes from
 * kiraya.get_tenant_credit(). None of this is summed or derived from raw
 * bill_items/payments rows in TypeScript.
 *
 * Apply Credit is only offered for FINALIZED/PARTIALLY_PAID bills with
 * available credit — the same eligibility
 * kiraya.apply_tenant_credit_to_bill() itself enforces (DRAFT/PAID/VOID
 * are never offered the action, matching the established pattern for
 * Finalize/Void in BillHeaderBand.tsx).
 */
export function BillPaymentSummary({
  bill,
  paidAmount,
  outstanding,
  creditApplied,
  availableCredit,
  canWrite,
}: {
  bill: BillDetail;
  paidAmount: number;
  outstanding: number;
  creditApplied: number;
  availableCredit: number;
  canWrite: boolean;
}) {
  const canApplyCredit =
    canWrite && CREDIT_APPLICATION_ELIGIBLE_STATUSES.includes(bill.status) && availableCredit > 0 && outstanding > 0;

  return (
    <div className={["card", gridStyles.cols4].join(" ")} style={{ display: "grid" }}>
      <div style={{ padding: "16px 18px", borderRight: "2px solid var(--color-divider)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 8 }}>
          Paid
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}>
          {formatCurrency(paidAmount, bill.currency_code)}
        </div>
      </div>
      <div style={{ padding: "16px 18px", borderRight: "2px solid var(--color-divider)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 8 }}>
          Credit Applied
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}>
          {formatCurrency(creditApplied, bill.currency_code)}
        </div>
      </div>
      <div style={{ padding: "16px 18px", borderRight: "2px solid var(--color-divider)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 8 }}>
          Outstanding
        </div>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 22,
            color: outstanding > 0 ? "var(--color-accent-700)" : "var(--color-text)",
          }}
        >
          {formatCurrency(outstanding, bill.currency_code)}
        </div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 8 }}>
          Available Credit
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: canApplyCredit ? 10 : 0 }}>
          {formatCurrency(availableCredit, bill.currency_code)}
        </div>
        {canApplyCredit ? <ApplyCreditDialog bill={bill} outstanding={outstanding} availableCredit={availableCredit} /> : null}
      </div>
    </div>
  );
}
