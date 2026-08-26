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
import { deriveUnitOccupancyStatus } from "@/lib/utils/unitStatus";
import type { UnitListItem } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";
import type { LeaseListItem } from "@/lib/queries/leases";

/**
 * Rent/Lease Ends stay out of scope (billing phase, P5.2B instruction #20);
 * Current Tenant is real, non-financial schema data now that leases exist
 * (P5.2C), shown alongside the Status column.
 *
 * P6.3-H: Status is never unit.status alone — deriveUnitOccupancyStatus()
 * combines it with whether this row's own currentLease is present, so a
 * unit with an ACTIVE lease reads "Occupied" even though nothing ever
 * writes unit.status = 'OCCUPIED' on assignment. MAINTENANCE/UNAVAILABLE
 * still come straight from unit.status, unaffected by occupancy.
 */
export function UnitTable({
  propertyId,
  units,
  unitTypes,
  currentLeases,
  canWrite,
  suggestedUnitCode,
}: {
  propertyId: string;
  units: UnitListItem[];
  unitTypes: UnitType[];
  currentLeases: Record<string, LeaseListItem>;
  canWrite: boolean;
  suggestedUnitCode: string;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <UnitFormDrawer
            mode="create"
            propertyId={propertyId}
            unitTypes={unitTypes}
            suggestedUnitCode={suggestedUnitCode}
          />
        </div>
      ) : null}

      {units.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No units yet"
          description="Add the first unit to start tracking this property's inventory."
          action={
            canWrite ? (
              <UnitFormDrawer
                mode="create"
                propertyId={propertyId}
                unitTypes={unitTypes}
                suggestedUnitCode={suggestedUnitCode}
              />
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Unit Type</TableHeaderCell>
              <TableHeaderCell>Current Tenant</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Area</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Floor</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Bedrooms</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Bathrooms</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => {
              const currentLease = currentLeases[unit.id];
              return (
                <TableRow key={unit.id}>
                  <TableCell style={{ fontWeight: 600 }}>
                    <Link href={`/app/units/${unit.id}`}>{unit.unit_code}</Link>
                  </TableCell>
                  <TableCell>
                    <UnitStatusTag status={deriveUnitOccupancyStatus(unit.status, Boolean(currentLease))} />
                  </TableCell>
                  <TableCell style={{ color: "var(--color-neutral-700)" }}>
                    {unit.unit_types?.name ?? "—"}
                  </TableCell>
                  <TableCell style={{ color: "var(--color-neutral-700)" }}>
                    {currentLease?.tenants ? (
                      <Link href={`/app/tenants/${currentLease.tenant_id}`}>
                        {currentLease.tenants.display_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell numeric>{unit.area != null ? `${unit.area} ${unit.area_unit ?? ""}`.trim() : "—"}</TableCell>
                  <TableCell numeric>{unit.floor_number ?? "—"}</TableCell>
                  <TableCell numeric>{unit.bedrooms ?? "—"}</TableCell>
                  <TableCell numeric>{unit.bathrooms ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
