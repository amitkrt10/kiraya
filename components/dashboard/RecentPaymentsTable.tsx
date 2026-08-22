import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { PaymentStatusTag } from "@/components/payments/PaymentStatusTag";
import type { PaymentListItem } from "@/lib/queries/payments";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Reuses the same payment fields already shown on /app/payments (Tenant,
 * Method, Amount, Date, Status) — the approved design's "Property / Unit"
 * column is omitted: kiraya.payments has no unit/property reference, and no
 * existing query anywhere resolves one for a payment, so adding it here
 * would mean inventing a new join rather than reusing an authoritative one.
 */
export function RecentPaymentsTable({ payments }: { payments: PaymentListItem[] }) {
  if (payments.length === 0) {
    return <p style={{ color: "var(--color-neutral-700)", fontSize: 13 }}>Nothing here yet.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Method</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {payment.tenants ? <Link href={`/app/tenants/${payment.tenants.id}`}>{payment.tenants.display_name}</Link> : "—"}
            </TableCell>
            <TableCell>{payment.payment_methods?.name ?? "—"}</TableCell>
            <TableCell numeric>{formatCurrency(payment.amount)}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{formatDate(payment.payment_date)}</TableCell>
            <TableCell>
              <PaymentStatusTag status={payment.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
