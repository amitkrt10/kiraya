import Link from "next/link";
import { Receipt } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PaymentAllocationItem } from "@/lib/queries/payments";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function PaymentAllocationsTable({
  allocations,
  currencyCode,
}: {
  allocations: PaymentAllocationItem[];
  currencyCode: string;
}) {
  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No allocations"
        description="This payment hasn't been applied to any bill — it may be fully available as credit, or there were no eligible finalized bills at the time it was recorded."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Bill</TableHeaderCell>
          <TableHeaderCell>Period</TableHeaderCell>
          <TableHeaderCell>Allocation Date</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount Applied</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {allocations.map((allocation) => (
          <TableRow key={allocation.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {allocation.bills ? (
                <Link href={`/app/billing/bills/${allocation.bills.id}`}>{allocation.bills.bill_number}</Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {allocation.bills ? `${allocation.bills.period_start} – ${allocation.bills.period_end}` : "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{allocation.allocation_date}</TableCell>
            <TableCell numeric>{formatCurrency(allocation.allocated_amount, currencyCode)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
