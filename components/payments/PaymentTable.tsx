import Link from "next/link";
import { PaymentStatusTag } from "./PaymentStatusTag";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import type { PaymentListItem } from "@/lib/queries/payments";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function PaymentTable({ payments }: { payments: PaymentListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Payment</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Method</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/payments/${payment.id}`}>{payment.payment_number}</Link>
            </TableCell>
            <TableCell>
              {payment.tenants ? (
                <Link href={`/app/tenants/${payment.tenants.id}`}>{payment.tenants.display_name}</Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{payment.payment_date}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{payment.payment_methods?.name ?? "—"}</TableCell>
            <TableCell numeric>{formatCurrency(payment.amount, payment.currency_code)}</TableCell>
            <TableCell>
              <PaymentStatusTag status={payment.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
