import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { TenantExitStatusTag } from "./TenantExitStatusTag";
import type { TenantExitListItem } from "@/lib/queries/tenantExits";

export function ExitTable({ exits }: { exits: TenantExitListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Exit Reference</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Property</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Notice Date</TableHeaderCell>
          <TableHeaderCell>Exit Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {exits.map((exit) => (
          <TableRow key={exit.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {/* "review" (step 2) is always unlocked once an exit exists — the
                  wizard step page itself redirects forward to whichever step
                  is actually reachable, so this link never needs to know the
                  settlement's status. */}
              <Link href={`/app/exits/${exit.id}/review`}>{exit.exit_reference}</Link>
            </TableCell>
            <TableCell>
              {exit.tenants ? (
                <Link href={`/app/tenants/${exit.tenant_id}`}>{exit.tenants.display_name}</Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {exit.leases?.units?.properties?.name ?? "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{exit.leases?.units?.unit_code ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{exit.notice_date ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {exit.actual_exit_date ?? exit.planned_exit_date ?? "—"}
            </TableCell>
            <TableCell>
              <TenantExitStatusTag status={exit.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
