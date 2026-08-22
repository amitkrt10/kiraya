import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import styles from "./PendingActionsPanel.module.css";

/**
 * Only "bills overdue" is shown — the approved design's mockup also lists a
 * "payment pending reversal review" and an "import row errors" item, but
 * neither has a real backend concept: reversal has no pending/review state
 * (it's immediate), and Imports has no working pipeline yet (P5.8 audit).
 * Showing them would mean inventing states that don't exist.
 */
export function PendingActionsPanel({ overdueCount, overduePropertyCount }: { overdueCount: number; overduePropertyCount: number }) {
  if (overdueCount === 0) {
    return <div className={styles.empty}>Nothing here yet.</div>;
  }

  return (
    <div className={styles.list}>
      <Link href="/app/billing/bills" className={styles.item}>
        <AlertTriangle width={16} height={16} className={styles.icon} style={{ color: "var(--color-accent-700)" }} aria-hidden="true" />
        <div>
          <div className={styles.title}>
            {overdueCount} bill{overdueCount === 1 ? "" : "s"} overdue
          </div>
          <div className={styles.subtitle}>
            Across {overduePropertyCount} propert{overduePropertyCount === 1 ? "y" : "ies"}
          </div>
        </div>
      </Link>
    </div>
  );
}
