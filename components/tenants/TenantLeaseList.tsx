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

export function TenantLeaseList({ leases }: { leases: LeaseListItem[] }) {
  if (leases.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No leases for this tenant"
        description="No active or historical leases have been recorded for this tenant yet."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Lease</TableHeaderCell>
          <TableHeaderCell>Property / Unit</TableHeaderCell>
          <TableHeaderCell>Start</TableHeaderCell>
          <TableHeaderCell>End</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leases.map((lease) => (
          <TableRow key={lease.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/leases/${lease.id}`}>{lease.lease_code}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.occupancy_start_date}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {lease.agreement_end_date ?? "Open-ended"}
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
