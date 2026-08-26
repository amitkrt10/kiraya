import Link from "next/link";
import { FileSignature } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import type { LeaseListItem } from "@/lib/queries/leases";

/**
 * P6.3-D: every unit this tenant has ever occupied, active or ended — the
 * internal lease code is never shown; each row links into that exact
 * occupancy (kiraya.leases remains the record underneath, but the user
 * only ever sees "Unit"/"Occupancy" here, not "Lease").
 *
 * P6.3-F: "Occupancy End" prefers actual_end_date (the real date an exit
 * completed) over agreement_end_date (a merely planned end).
 *
 * P6.3-J: the link now carries the row's own lease.id, not just unit_id
 * — `/app/units/{unitId}/occupancies/{leaseId}` — because the bare unit
 * page only ever shows whichever occupancy is ACTIVE *today*. For an
 * ended row, that used to silently substitute a different (newer)
 * tenant's current data if the unit had been reassigned since (the core
 * bug the P6.3-I audit found and reproduced live); this link now always
 * lands on the exact occupancy the row represents, current or ended.
 */
export function TenantLeaseList({ leases }: { leases: LeaseListItem[] }) {
  if (leases.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No occupancy history for this tenant"
        description="No active or past unit occupancies have been recorded for this tenant yet."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Occupancy Start</TableHeaderCell>
          <TableHeaderCell>Occupancy End</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leases.map((lease) => (
          <TableRow key={lease.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/units/${lease.unit_id}/occupancies/${lease.id}`}>
                {lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "—"}
              </Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.occupancy_start_date}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {lease.actual_end_date ?? lease.agreement_end_date ?? "Open-ended"}
            </TableCell>
            <TableCell>
              <LeaseStatusTag status={lease.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
