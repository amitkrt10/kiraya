import Link from "next/link";
import { DoorOpen } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { UnitStatusTag } from "./UnitStatusTag";
import { UnitFormDrawer } from "./UnitFormDrawer";
import type { UnitListItem } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";

/**
 * The approved design's Units tab shows Tenant/Rent/Lease Ends columns —
 * those belong to the Tenants/Leases/Billing phases and are intentionally
 * not shown here (P5.2B instruction #20). Unit Type/Area/Floor/Bedrooms/
 * Bathrooms are the schema-appropriate substitute for this phase.
 */
export function UnitTable({
  propertyId,
  units,
  unitTypes,
  canWrite,
}: {
  propertyId: string;
  units: UnitListItem[];
  unitTypes: UnitType[];
  canWrite: boolean;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <UnitFormDrawer mode="create" propertyId={propertyId} unitTypes={unitTypes} />
        </div>
      ) : null}

      {units.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No units yet"
          description="Add the first unit to start tracking this property's inventory."
          action={
            canWrite ? <UnitFormDrawer mode="create" propertyId={propertyId} unitTypes={unitTypes} /> : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Unit Type</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Area</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Floor</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Bedrooms</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Bathrooms</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  <Link href={`/app/units/${unit.id}`}>{unit.name ? `${unit.unit_code} · ${unit.name}` : unit.unit_code}</Link>
                </TableCell>
                <TableCell>
                  <UnitStatusTag status={unit.status} />
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {unit.unit_types?.name ?? "—"}
                </TableCell>
                <TableCell numeric>{unit.area != null ? `${unit.area} ${unit.area_unit ?? ""}`.trim() : "—"}</TableCell>
                <TableCell numeric>{unit.floor_number ?? "—"}</TableCell>
                <TableCell numeric>{unit.bedrooms ?? "—"}</TableCell>
                <TableCell numeric>{unit.bathrooms ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
