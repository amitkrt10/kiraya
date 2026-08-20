import { BillItemsTable } from "./BillItemsTable";
import type { BillDetail, BillAdjustmentRow, BillItemRow } from "@/lib/queries/bills";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function BillChargesPanel({
  bill,
  items,
  adjustments,
}: {
  bill: BillDetail;
  items: BillItemRow[];
  adjustments: BillAdjustmentRow[];
}) {
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Charges</div>
      <BillItemsTable items={items} currencyCode={bill.currency_code} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          fontSize: 13,
          color: "var(--color-neutral-700)",
          borderTop: "1px solid var(--color-neutral-300)",
          marginTop: 8,
        }}
      >
        <span>Subtotal</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(bill.subtotal, bill.currency_code)}</span>
      </div>

      {bill.discount_amount > 0 ? (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "var(--color-neutral-700)" }}>
          <span>Discount</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>−{formatCurrency(bill.discount_amount, bill.currency_code)}</span>
        </div>
      ) : null}

      {adjustments.map((adjustment) => (
        <div
          key={adjustment.id}
          style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "var(--color-neutral-700)" }}
        >
          <span>{adjustment.description}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(adjustment.amount, bill.currency_code)}</span>
        </div>
      ))}

      {bill.previous_balance_amount > 0 ? (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "var(--color-neutral-700)" }}>
          <span>Previous balance carried forward</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(bill.previous_balance_amount, bill.currency_code)}
          </span>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 0 0",
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "var(--font-heading)",
          borderTop: "2px solid var(--color-text)",
          marginTop: 8,
        }}
      >
        <span>Total</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(bill.total_amount, bill.currency_code)}</span>
      </div>
    </div>
  );
}
