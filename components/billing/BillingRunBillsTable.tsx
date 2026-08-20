import Link from "next/link";
import { FileText } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { BillStatusTag } from "./BillStatusTag";
import type { BillingRunBillItem } from "@/lib/queries/billingRuns";

export function BillingRunBillsTable({ bills }: { bills: BillingRunBillItem[] }) {
  if (bills.length === 0) {
    return (
      <EmptyState icon={FileText} title="No bills generated" description="This run didn't generate any bills." />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Bill</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Total</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/billing/bills/${bill.id}`}>{bill.bill_number}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{bill.tenants?.display_name ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{bill.units?.unit_code ?? "—"}</TableCell>
            <TableCell numeric>{bill.total_amount}</TableCell>
            <TableCell>
              <BillStatusTag status={bill.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
