import { BillingRunStatusTag } from "./BillingRunStatusTag";
import type { BillingRunListItem } from "@/lib/queries/billingRuns";
import styles from "@/components/properties/PropertyHeaderBand.module.css";

export function BillingRunHeaderBand({ run }: { run: BillingRunListItem }) {
  return (
    <div className={styles.band}>
      <div>
        <div className={styles.titleRow}>
          <div className={styles.name}>{run.run_code}</div>
          <BillingRunStatusTag status={run.status} />
        </div>
        <div className={styles.meta}>
          {run.period_start} – {run.period_end} · {run.properties?.name ?? "All properties"}
        </div>
      </div>
    </div>
  );
}
