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
import { OwnershipFormDrawer } from "./OwnershipFormDrawer";
import { EndOwnershipButton } from "./EndOwnershipButton";
import type { OwnerRow, PropertyOwnershipItem } from "@/lib/queries/owners";
import { formatOwnershipPercentage, isOwnershipActive } from "@/lib/utils/ownership";

export function OwnershipTable({
  propertyId,
  ownerships,
  owners,
  canWrite,
}: {
  propertyId: string;
  ownerships: PropertyOwnershipItem[];
  owners: OwnerRow[];
  canWrite: boolean;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <OwnershipFormDrawer mode="create" propertyId={propertyId} owners={owners} />
        </div>
      ) : null}

      {ownerships.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No ownership records"
          description="No owners have been assigned to this property yet."
          action={
            canWrite ? <OwnershipFormDrawer mode="create" propertyId={propertyId} owners={owners} /> : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Owner</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Ownership %</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {canWrite ? <TableHeaderCell aria-label="Actions" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {ownerships.map((ownership) => {
              const active = isOwnershipActive(ownership);
              return (
                <TableRow key={ownership.id}>
                  <TableCell style={{ fontWeight: 600 }}>
                    {ownership.owners?.display_name ?? "Unknown owner"}
                  </TableCell>
                  <TableCell numeric>{formatOwnershipPercentage(ownership.ownership_percentage)}</TableCell>
                  <TableCell style={{ color: "var(--color-neutral-700)" }}>
                    {ownership.owners?.email ?? ownership.owners?.phone ?? "—"}
                  </TableCell>
                  <TableCell style={{ color: "var(--color-neutral-700)" }}>
                    {active ? "Active" : `Ended ${ownership.ownership_end_date}`}
                  </TableCell>
                  {canWrite ? (
                    <TableCell>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <OwnershipFormDrawer
                          mode="edit"
                          propertyId={propertyId}
                          owners={owners}
                          ownership={ownership}
                        />
                        {active ? (
                          <EndOwnershipButton ownership={ownership} propertyId={propertyId} />
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
