import { AlertTriangle, Ban, Check, CheckCheck, Circle, CircleDot, type LucideIcon } from "lucide-react";
import type { BillStatusCounts, BillDueBreakdown } from "@/lib/queries/bills";
import styles from "./BillingStatusStrip.module.css";

/**
 * Finalized/Paid/Partially Paid/Void are the real kiraya.bills.status enum
 * counts (kiraya.getBillStatusCounts, already used by the Billing Dashboard
 * tiles). Outstanding/Overdue are the due-date split of the still-open
 * (FINALIZED/PARTIALLY_PAID) bills from kiraya.getBillDueBreakdown — the
 * same subset, viewed by due date rather than status, matching the design
 * system's Section A tag semantics (they are not a separate exclusive
 * partition from "Finalized").
 */
export function BillingStatusStrip({ counts, dueBreakdown }: { counts: BillStatusCounts; dueBreakdown: BillDueBreakdown }) {
  const tiles: { label: string; count: number; icon: LucideIcon; accent?: boolean }[] = [
    { label: "Finalized", count: counts.FINALIZED, icon: CheckCheck },
    { label: "Paid", count: counts.PAID, icon: Check },
    { label: "Partially Paid", count: counts.PARTIALLY_PAID, icon: CircleDot },
    { label: "Outstanding", count: dueBreakdown.outstandingCount, icon: Circle },
    { label: "Overdue", count: dueBreakdown.overdueCount, icon: AlertTriangle, accent: true },
    { label: "Void", count: counts.VOID, icon: Ban },
  ];

  return (
    <div className={styles.strip}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <tile.icon width={16} height={16} style={{ color: tile.accent ? "var(--color-accent-700)" : "var(--color-text)" }} aria-hidden="true" />
          <div>
            <div className={styles.count}>{tile.count}</div>
            <div className={styles.label}>{tile.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
