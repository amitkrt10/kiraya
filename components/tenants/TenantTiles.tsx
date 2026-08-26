import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import styles from "@/components/properties/PropertyTiles.module.css";

const STATUS_LABELS: Record<TenantRow["status"], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

/**
 * Outstanding/Credit are now real, authoritative values (kiraya.
 * get_tenant_due()/get_tenant_credit(), added in P5.2E) — P5.2C deferred
 * them because no such source existed yet. "Current Rent"/"Deposit Held"
 * from the original design remain out of scope (rent varies by rule/period,
 * not a single authoritative figure; deposits arrive in a later phase).
 */
export function TenantTiles({
  tenant,
  activeLeaseCount,
  currentLease,
  outstanding,
  credit,
}: {
  tenant: TenantRow;
  activeLeaseCount: number;
  currentLease: LeaseListItem | null;
  outstanding: number;
  credit: number;
}) {
  const tiles = [
    { label: "Status", value: STATUS_LABELS[tenant.status] },
    { label: "Active Units", value: activeLeaseCount.toString() },
    {
      label: "Current Property / Unit",
      value: currentLease?.units
        ? `${currentLease.units.properties?.name ?? ""} · ${currentLease.units.unit_code}`
        : "—",
    },
    { label: "Occupancy Ends", value: currentLease?.agreement_end_date ?? "—" },
    { label: "Outstanding", value: formatCurrency(outstanding) },
    { label: "Available Credit", value: formatCurrency(credit) },
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
