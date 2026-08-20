import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { BillingRunStatusTag } from "./BillingRunStatusTag";
import type { BillingRunListItem } from "@/lib/queries/billingRuns";

export function BillingRunTable({ runs }: { runs: BillingRunListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Run</TableHeaderCell>
          <TableHeaderCell>Period</TableHeaderCell>
          <TableHeaderCell>Scope</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Bills Generated</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Started</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/billing/runs/${run.id}`}>{run.run_code}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {run.period_start} – {run.period_end}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {run.properties?.name ?? "All properties"}
            </TableCell>
            <TableCell numeric>
              {run.successful_bills} / {run.total_bills}
              {run.failed_bills > 0 ? ` (${run.failed_bills} failed)` : ""}
            </TableCell>
            <TableCell>
              <BillingRunStatusTag status={run.status} />
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
