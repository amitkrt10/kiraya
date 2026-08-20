import { Skeleton, SkeletonTableRows } from "@/components/ui/Skeleton";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";

export default function PaymentsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading payments" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={70} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Payment</TableHeaderCell>
            <TableHeaderCell>Tenant</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Method</TableHeaderCell>
            <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <SkeletonTableRows columns={6} rows={5} />
        </TableBody>
      </Table>
    </div>
  );
}
