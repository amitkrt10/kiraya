import type { BillDetail } from "@/lib/queries/bills";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * Every value here is authoritative — paid comes from
 * kiraya.get_bill_paid_amount(), outstanding from kiraya.get_bill_balance(),
 * and credit applied is read directly from posted CREDIT_APPLICATION
 * ledger entries against this bill. None of this is summed or derived from
 * raw bill_items/payments rows in TypeScript.
 */
export function BillPaymentSummary({
  bill,
  paidAmount,
  outstanding,
  creditApplied,
}: {
  bill: BillDetail;
  paidAmount: number;
  outstanding: number;
  creditApplied: number;
}) {
  return (
    <div
      className="card"
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
    >
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
      <div style={{ padding: "16px 18px" }}>
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
    </div>
  );
}
