import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BillPaymentApplied } from "@/lib/queries/payments";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function BillPaymentsAppliedTable({ payments, currencyCode }: { payments: BillPaymentApplied[]; currencyCode: string }) {
  if (payments.length === 0) {
    return (
      <EmptyState icon={CreditCard} title="No payments applied" description="No payments have been applied to this bill yet." />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Method</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount Applied</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((payment, index) => (
          <TableRow key={`${payment.paymentId}-${index}`}>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{payment.allocationDate}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{payment.methodName ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{payment.referenceNumber ?? "—"}</TableCell>
            <TableCell numeric>
              <Link href={`/app/payments/${payment.paymentId}`}>{formatCurrency(payment.allocatedAmount, currencyCode)}</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
