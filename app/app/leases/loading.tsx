import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

export default function LeasesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading leases">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Lease</TableHeaderCell>
            <TableHeaderCell>Tenant</TableHeaderCell>
            <TableHeaderCell>Property</TableHeaderCell>
            <TableHeaderCell>Unit</TableHeaderCell>
            <TableHeaderCell>Start</TableHeaderCell>
            <TableHeaderCell>End</TableHeaderCell>
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
