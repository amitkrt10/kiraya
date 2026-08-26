import Link from "next/link";
import { History } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import type { LeaseListItem } from "@/lib/queries/leases";

/**
 * P6.3-J: ended occupancies for this unit, each linking to its own exact
 * `/app/units/{unitId}/occupancies/{leaseId}` — never the bare
 * `/app/units/{unitId}`, which would show whichever tenant currently
 * occupies the unit instead of the one this row is actually about. This
 * is the fix for the P6.3-I audit's core finding: a unit's occupancy
 * history was previously unreachable from Unit Detail at all.
 */
export function PastOccupanciesList({ unitId, pastLeases }: { unitId: string; pastLeases: LeaseListItem[] }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
        Past Occupancies
      </div>
      {pastLeases.length === 0 ? (
        <EmptyState
          icon={History}
          title="No past occupancies"
          description="Ended occupancies for this unit will appear here."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tenant</TableHeaderCell>
              <TableHeaderCell>Occupancy Start</TableHeaderCell>
              <TableHeaderCell>Occupancy End</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pastLeases.map((lease) => (
              <TableRow key={lease.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  <Link href={`/app/units/${unitId}/occupancies/${lease.id}`}>
                    {lease.tenants?.display_name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.occupancy_start_date}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {lease.actual_end_date ?? lease.agreement_end_date ?? "—"}
                </TableCell>
                <TableCell>
                  <LeaseStatusTag status={lease.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
