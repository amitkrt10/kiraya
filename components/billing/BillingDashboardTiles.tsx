import type { BillStatusCounts } from "@/lib/queries/bills";
import styles from "@/components/properties/PropertyTiles.module.css";

/**
 * "Outstanding"/"Collected" tiles from the approved design are intentionally
 * omitted — they depend on ledger/payment data that doesn't exist until
 * P5.2E. Each tile shown here is a plain, authoritative COUNT (kiraya.bills
 * grouped by its real status enum), never a sum computed in the browser.
 */
export function BillingDashboardTiles({ counts }: { counts: BillStatusCounts }) {
  const tiles = [
    { label: "Draft Bills", value: counts.DRAFT.toString() },
    { label: "Finalized Bills", value: counts.FINALIZED.toString() },
    { label: "Partially Paid", value: counts.PARTIALLY_PAID.toString() },
    { label: "Paid", value: counts.PAID.toString() },
    { label: "Void", value: counts.VOID.toString() },
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
