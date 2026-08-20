import type { BillingRunListItem } from "@/lib/queries/billingRuns";
import styles from "@/components/properties/PropertyTiles.module.css";

export function BillingRunSummary({ run }: { run: BillingRunListItem }) {
  const tiles = [
    { label: "Total Attempted", value: run.total_bills.toString() },
    { label: "Generated", value: run.successful_bills.toString() },
    { label: "Failed", value: run.failed_bills.toString() },
    {
      label: "Started",
      value: run.started_at ? new Date(run.started_at).toLocaleString() : "—",
    },
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
