import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import styles from "@/components/properties/PropertyTiles.module.css";

const STATUS_LABELS: Record<TenantRow["status"], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

/**
 * Non-financial tenant/lease tiles — the approved design's tiles (Current
 * Rent, Outstanding, Available Credit, Deposit Held) are financial and out
 * of scope for this phase (task instruction #24); only "Lease Ends" from
 * the original design is real, non-financial schema data and is kept.
 */
export function TenantTiles({
  tenant,
  activeLeaseCount,
  currentLease,
}: {
  tenant: TenantRow;
  activeLeaseCount: number;
  currentLease: LeaseListItem | null;
}) {
  const tiles = [
    { label: "Status", value: STATUS_LABELS[tenant.status] },
    { label: "Active Leases", value: activeLeaseCount.toString() },
    {
      label: "Current Property / Unit",
      value: currentLease?.units
        ? `${currentLease.units.properties?.name ?? ""} · ${currentLease.units.unit_code}`
        : "—",
    },
    { label: "Lease Ends", value: currentLease?.agreement_end_date ?? "—" },
  ];

  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <div className={styles.label}>{tile.label}</div>
          <div className={styles.value}>{tile.value}</div>
        </div>
      ))}
    </div>
  );
}
