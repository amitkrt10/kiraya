import { Skeleton, SkeletonTableRows } from "@/components/ui/Skeleton";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";

export default function BillingLoading() {
  return (
    <div aria-busy="true" aria-label="Loading billing" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={90} />
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
          <SkeletonTableRows columns={6} rows={5} />
        </TableBody>
      </Table>
    </div>
  );
}
