import type { OrganizationDashboardRow } from "@/lib/queries/dashboard";
import styles from "./CollectionPerformanceChart.module.css";

const MAX_BAR_HEIGHT = 140;

function monthLabel(periodMonth: string): string {
  return new Date(`${periodMonth}T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
}

/** collection_percentage is computed in kiraya.v_organization_dashboard — this only maps it to bar heights, no math. */
export function CollectionPerformanceChart({ monthly }: { monthly: OrganizationDashboardRow[] }) {
  if (monthly.length === 0) {
    return <div className={styles.empty}>No billing activity yet — this chart fills in once bills and payments exist.</div>;
  }

  return (
    <>
      <div className={styles.chart}>
        {monthly.map((row) => {
          const pct = Math.max(0, Math.min(100, row.collection_percentage ?? 0));
          return (
            <div key={row.period_month} className={styles.bar}>
              <div className={styles.pct}>{pct.toFixed(0)}%</div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ height: `${(MAX_BAR_HEIGHT * pct) / 100}px` }} />
              </div>
              <div className={styles.month}>{row.period_month ? monthLabel(row.period_month) : "—"}</div>
            </div>
          );
        })}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendSwatch} />
          Collected vs billed
        </div>
      </div>
    </>
  );
}
