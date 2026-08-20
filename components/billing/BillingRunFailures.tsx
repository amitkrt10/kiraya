import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BillingRunFailure } from "@/lib/queries/billingRuns";

export function BillingRunFailures({ failures }: { failures: BillingRunFailure[] }) {
  if (failures.length === 0) {
    return (
      <EmptyState icon={TriangleAlert} title="No failures" description="Every lease in scope was billed successfully." />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Lease</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Reason</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {failures.map((failure) => (
          <TableRow key={failure.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {failure.leaseCode ? <Link href={`/app/leases/${failure.resource_id}`}>{failure.leaseCode}</Link> : "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{failure.tenantName ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{failure.unitCode ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-accent-700)" }}>{failure.description ?? "Unknown error"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
