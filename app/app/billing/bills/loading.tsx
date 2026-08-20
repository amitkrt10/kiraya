import { Skeleton, SkeletonTableRows } from "@/components/ui/Skeleton";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";

export default function BillsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading bills" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={70} />
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
          <SkeletonTableRows columns={7} rows={5} />
        </TableBody>
      </Table>
    </div>
  );
}
