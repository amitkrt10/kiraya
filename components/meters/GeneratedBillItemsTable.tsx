import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import type { GeneratedUtilityBillItem } from "@/lib/queries/meterReadings";

function formatCurrency(amount: number, currencyCode = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/** Read-only — every value here is read straight from the already-generated bill_item row (kiraya.generate_utility_bill_items()'s own snapshot), never recalculated. */
export function GeneratedBillItemsTable({ items }: { items: GeneratedUtilityBillItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Bill</TableHeaderCell>
          <TableHeaderCell>Period</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Consumption</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Rate</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {item.bills ? <Link href={`/app/billing/bills/${item.bills.id}`}>{item.bills.bill_number}</Link> : "—"}
            </TableCell>
            <TableCell>{item.bills ? `${item.bills.period_start} – ${item.bills.period_end}` : "—"}</TableCell>
            <TableCell numeric>{item.quantity ?? "—"}</TableCell>
            <TableCell numeric>{item.unit_rate !== null ? formatCurrency(item.unit_rate) : "—"}</TableCell>
            <TableCell numeric>{formatCurrency(item.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
