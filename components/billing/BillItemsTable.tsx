import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt } from "lucide-react";
import type { BillItemRow } from "@/lib/queries/bills";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * item_type is free text in the schema (no enum) — the actual generation
 * functions only ever write RENT / UTILITY / PREVIOUS_DUE today, but this
 * is a generic label formatter, not a fixed lookup, so any other value the
 * database ever produces still renders reasonably instead of falling
 * through to a raw/blank cell.
 */
function formatItemType(itemType: string): string {
  return itemType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BillItemsTable({ items, currencyCode }: { items: BillItemRow[]; currencyCode: string }) {
  if (items.length === 0) {
    return <EmptyState icon={Receipt} title="No charges yet" description="This bill has no line items." />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Description</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Quantity</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Rate</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.description}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{formatItemType(item.item_type)}</TableCell>
            <TableCell numeric>{item.quantity ?? "—"}</TableCell>
            <TableCell numeric>{item.unit_rate != null ? formatCurrency(item.unit_rate, currencyCode) : "—"}</TableCell>
            <TableCell numeric>{formatCurrency(item.amount, currencyCode)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
