import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/Table";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

export default function PropertiesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading properties">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Location</TableHeaderCell>
            <TableHeaderCell style={{ textAlign: "right" }}>Units</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <SkeletonTableRows columns={6} rows={5} />
        </TableBody>
      </Table>
    </div>
  );
}
