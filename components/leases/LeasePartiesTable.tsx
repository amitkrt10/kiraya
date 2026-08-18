import { Users } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeasePartyFormDrawer } from "./LeasePartyFormDrawer";
import type { LeasePartyItem } from "@/lib/queries/leaseParties";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import { LEASE_PARTY_ROLES } from "@/lib/validation/leaseParty";

const ROLE_LABELS: Record<(typeof LEASE_PARTY_ROLES)[number], string> = {
  CO_TENANT: "Co-Tenant",
  OCCUPANT: "Occupant",
  GUARANTOR: "Guarantor",
  OTHER: "Other",
};

export function LeasePartiesTable({
  leaseId,
  parties,
  tenants,
  canWrite,
}: {
  leaseId: string;
  parties: LeasePartyItem[];
  tenants: TenantPickerItem[];
  canWrite: boolean;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <LeasePartyFormDrawer mode="create" leaseId={leaseId} tenants={tenants} />
        </div>
      ) : null}

      {parties.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No additional parties"
          description="Only the primary tenant is on this lease. Add a co-tenant, occupant, or guarantor if needed."
          action={canWrite ? <LeasePartyFormDrawer mode="create" leaseId={leaseId} tenants={tenants} /> : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              {canWrite ? <TableHeaderCell aria-label="Actions" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {parties.map((party) => (
              <TableRow key={party.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  {party.tenants?.display_name ?? party.display_name ?? "—"}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {ROLE_LABELS[party.party_role]}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {party.phone ?? party.email ?? "—"}
                </TableCell>
                {canWrite ? (
                  <TableCell>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <LeasePartyFormDrawer mode="edit" leaseId={leaseId} tenants={tenants} party={party} />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
