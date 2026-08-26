import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BillingRunFailure } from "@/lib/queries/billingRuns";

function formatDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * P6.3-E: Tenant + Unit, never the internal lease code/id — a failure is
 * something that happened to a specific tenant's occupancy of a specific
 * unit, and that's fully identifiable without exposing kiraya.leases.
 */
export function BillingRunFailures({ failures }: { failures: BillingRunFailure[] }) {
  if (failures.length === 0) {
    return (
      <EmptyState icon={TriangleAlert} title="No failures" description="Every occupancy in scope was billed successfully." />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Failure</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {failures.map((failure) => (
          <TableRow key={failure.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {failure.tenantId && failure.tenantName ? (
                <Link href={`/app/tenants/${failure.tenantId}`}>{failure.tenantName}</Link>
              ) : (
                failure.tenantName ?? "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {failure.unitId && failure.unitCode ? (
                <Link href={`/app/units/${failure.unitId}`}>
                  {failure.propertyName ? `${failure.propertyName} · ${failure.unitCode}` : failure.unitCode}
                </Link>
              ) : (
                failure.unitCode ?? "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-accent-700)" }}>{failure.description ?? "Unknown error"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{formatDate(failure.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
