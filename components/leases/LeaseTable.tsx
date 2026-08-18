import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { LeaseStatusTag } from "./LeaseStatusTag";
import { Tag } from "@/components/ui/Tag";
import type { LeaseListItem } from "@/lib/queries/leases";
import { isLeaseExpiringSoon } from "@/lib/utils/leaseExpiry";

export function LeaseTable({ leases }: { leases: LeaseListItem[] }) {
  return (
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
        {leases.map((lease) => (
          <TableRow key={lease.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/leases/${lease.id}`}>{lease.lease_code}</Link>
            </TableCell>
            <TableCell>
              {lease.tenants ? (
                <Link href={`/app/tenants/${lease.tenant_id}`}>{lease.tenants.display_name}</Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {lease.units?.properties?.name ?? "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.units?.unit_code ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.occupancy_start_date}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {lease.agreement_end_date ?? "Open-ended"}
                {isLeaseExpiringSoon(lease.agreement_end_date, lease.status) ? (
                  <Tag variant="accent" icon={TriangleAlert}>
                    Expiring
                  </Tag>
                ) : null}
              </div>
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
