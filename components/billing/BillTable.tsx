import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { BillStatusTag } from "./BillStatusTag";
import type { BillListItem } from "@/lib/queries/bills";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function BillTable({ bills }: { bills: BillListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Bill</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Property / Unit</TableHeaderCell>
          <TableHeaderCell>Period</TableHeaderCell>
          <TableHeaderCell>Due Date</TableHeaderCell>
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
            <TableCell>
              {bill.tenants ? (
                <Link href={`/app/tenants/${bill.tenants.id}`}>{bill.tenants.display_name}</Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {bill.units ? `${bill.units.properties?.name ?? ""} · ${bill.units.unit_code}` : "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {bill.period_start} – {bill.period_end}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{bill.due_date ?? "—"}</TableCell>
            <TableCell numeric>{formatCurrency(bill.total_amount, bill.currency_code)}</TableCell>
            <TableCell>
              <BillStatusTag status={bill.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
