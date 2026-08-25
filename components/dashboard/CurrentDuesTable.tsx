import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import type { CurrentDueRow } from "@/lib/queries/dashboard";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

/**
 * "Whose rent is currently pending, and how much do they owe?" — amountDue
 * comes straight from getCurrentDues(), itself a thin read over
 * kiraya.v_tenant_outstanding (get_tenant_due() under the hood). Nothing is
 * computed here — this component only renders what the query already
 * filtered (> 0) and sorted (descending).
 */
export function CurrentDuesTable({ dues }: { dues: CurrentDueRow[] }) {
  if (dues.length === 0) {
    return <p style={{ color: "var(--color-neutral-700)", fontSize: 13 }}>No tenant currently owes anything.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Current Due</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {dues.map((due) => (
          <TableRow key={due.tenantId}>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{due.unitLabel}</TableCell>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/tenants/${due.tenantId}`}>{due.tenantName}</Link>
            </TableCell>
            <TableCell numeric style={{ color: "var(--color-accent-700)", fontWeight: 600 }}>
              {formatCurrency(due.amountDue)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
