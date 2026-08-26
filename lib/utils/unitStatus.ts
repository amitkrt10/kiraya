import type { UnitStatus } from "@/lib/queries/units";

/**
 * P6.3-H: the one place that decides what Occupied/Vacant/Maintenance/
 * Unavailable a user should actually see. `units.status` alone is not
 * reliable for Occupied/Vacant (P6.3-A found it badly desynced, and
 * kiraya.create_tenant_unit_assignment() never writes 'OCCUPIED' — the
 * authoritative signal is always whether an ACTIVE lease exists for the
 * unit, same as kiraya.unit_is_assignable()). MAINTENANCE/UNAVAILABLE are
 * genuine operational states set directly on the unit, independent of
 * occupancy, and take precedence when set — a unit under maintenance
 * still reads as "Maintenance" even if it happens to carry an ACTIVE
 * lease, mirroring unit_is_assignable()'s own precedence.
 *
 * Deliberately lives in a plain util module (not lib/queries/units.ts,
 * which is `import "server-only"`) — several of this function's callers
 * (UnitTable, UnitHeaderBand, UnitOverview) end up in a client bundle
 * because they're rendered from client-boundary parents, and a
 * server-only import anywhere in that chain breaks the build.
 */
export function deriveUnitOccupancyStatus(rawStatus: UnitStatus, hasActiveTenant: boolean): UnitStatus {
  if (rawStatus === "MAINTENANCE" || rawStatus === "UNAVAILABLE") {
    return rawStatus;
  }
  return hasActiveTenant ? "OCCUPIED" : "VACANT";
}
