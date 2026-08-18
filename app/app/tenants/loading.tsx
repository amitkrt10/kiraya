import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

export default function TenantsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tenants">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Contact</TableHeaderCell>
            <TableHeaderCell>Property / Unit</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <SkeletonTableRows columns={6} rows={5} />
        </TableBody>
      </Table>
    </div>
  );
}
