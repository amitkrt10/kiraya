import type { OrganizationDashboardRow } from "@/lib/queries/dashboard";
import type { PropertyUnitCounts } from "@/lib/queries/properties";
import styles from "./DashboardKpiStrip.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function monthLabel(periodMonth: string): string {
  return new Date(`${periodMonth}T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
}

/**
 * Every value here comes directly from kiraya.v_organization_dashboard (or,
 * for the Outstanding delta, kiraya.getBillDueBreakdown()) — no client-side
 * financial math — EXCEPT Units/Occupancy, which use unitCounts
 * (getOrganizationUnitCounts(), P6.3-E) instead of the view's own
 * vacant_unit_count/occupancy_percentage columns: those are derived from
 * units.status, the same unreliable signal P6.3-D already replaced at the
 * property level. unitCounts is ACTIVE-lease-derived, matching Unit Detail
 * and Property occupancy. Deltas the approved design shows but that have
 * no authoritative source today (e.g. "+1.1% vs last month", "4 new this
 * month") are omitted rather than invented.
 */
export function DashboardKpiStrip({
  latest,
  overdueCount,
  unitCounts,
}: {
  latest: OrganizationDashboardRow | null;
  overdueCount: number;
  unitCounts: PropertyUnitCounts;
}) {
  const tiles = latest
    ? [
        { label: "Properties", value: latest.property_count ?? 0, delta: null },
        { label: "Units", value: unitCounts.totalUnits, delta: `${unitCounts.vacantUnits} vacant`, accent: false },
        { label: "Occupancy", value: `${unitCounts.occupancyPercentage.toFixed(1)}%`, delta: null },
        { label: "Tenants", value: latest.active_tenant_count ?? 0, delta: null },
        {
          label: "Outstanding",
          value: formatCurrency(latest.active_tenant_dues ?? 0),
          delta: overdueCount > 0 ? `${overdueCount} bill${overdueCount === 1 ? "" : "s"} overdue` : "No bills overdue",
          accent: overdueCount > 0,
        },
        {
          label: `Collected${latest.period_month ? ` (${monthLabel(latest.period_month)})` : ""}`,
          value: formatCurrency(latest.collected_amount ?? 0),
          delta: `${(latest.collection_percentage ?? 0).toFixed(0)}% of billed`,
          accent: false,
        },
      ]
    : [
        { label: "Properties", value: 0, delta: null },
        { label: "Units", value: unitCounts.totalUnits, delta: `${unitCounts.vacantUnits} vacant`, accent: false },
        { label: "Occupancy", value: `${unitCounts.occupancyPercentage.toFixed(1)}%`, delta: null },
        { label: "Tenants", value: 0, delta: null },
        { label: "Outstanding", value: formatCurrency(0), delta: null },
        { label: "Collected", value: formatCurrency(0), delta: null },
      ];

  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <div className={styles.label}>{tile.label}</div>
          <div className={styles.value}>{tile.value}</div>
          {tile.delta ? (
            <div className={[styles.delta, "accent" in tile && tile.accent ? styles.deltaAccent : ""].join(" ")}>{tile.delta}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
