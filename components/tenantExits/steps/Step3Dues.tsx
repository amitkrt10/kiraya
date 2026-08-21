import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import { BillStatusTag } from "@/components/billing/BillStatusTag";
import type { OutstandingBillItem } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function Step3Dues({
  bills,
  totalOutstanding,
  currencyCode,
  nextHref,
  backHref,
}: {
  bills: OutstandingBillItem[];
  totalOutstanding: number;
  currencyCode: string;
  nextHref: string;
  backHref: string;
}) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Outstanding Dues</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 24 }}>
        Every unpaid bill for this tenant, from the authoritative ledger — nothing calculated here.
      </div>

      <div className="card" style={{ padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)" }}>Total Outstanding</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26 }}>{formatCurrency(totalOutstanding, currencyCode)}</div>
      </div>

      {bills.length === 0 ? (
        <div style={{ marginBottom: 24 }}>
          <EmptyState icon={FileText} title="No outstanding bills" description="This tenant has no unpaid bills on file." />
        </div>
      ) : (
        <table className="table" style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th>Bill</th>
              <th>Period</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th style={{ textAlign: "right" }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.bill_number}</td>
                <td style={{ color: "var(--color-neutral-700)" }}>
                  {bill.period_start} – {bill.period_end}
                </td>
                <td>
                  <BillStatusTag status={bill.status} />
                </td>
                <td className="num">{formatCurrency(bill.total_amount, bill.currency_code)}</td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {formatCurrency(bill.balance, bill.currency_code)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={nextHref} className="btn btn-primary">
          Continue to Deposit Review
        </Link>
        <Link href={backHref} className="btn btn-secondary">
          Back
        </Link>
      </div>
    </>
  );
}
