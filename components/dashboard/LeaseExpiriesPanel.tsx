import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import type { UpcomingLeaseExpiry } from "@/lib/queries/dashboard";
import styles from "./LeaseExpiriesPanel.module.css";

const URGENT_STATUSES = new Set(["EXPIRED", "EXPIRING_7_DAYS"]);

function daysLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Sourced from kiraya.v_lease_expiry_alerts — the same authoritative view built for reporting, wired here for the first time. */
export function LeaseExpiriesPanel({ expiries }: { expiries: UpcomingLeaseExpiry[] }) {
  if (expiries.length === 0) {
    return <div className={styles.empty}>Nothing here yet.</div>;
  }

  return (
    <div className={styles.list}>
      {expiries.map((expiry) => {
        const urgent = URGENT_STATUSES.has(expiry.alertStatus);
        return (
          <Link key={expiry.leaseId} href={`/app/units/${expiry.unitId}`} className={styles.item}>
            <div>
              <div className={styles.tenant}>{expiry.tenantName}</div>
              <div className={styles.unit}>{expiry.unitLabel}</div>
            </div>
            <Tag variant={urgent ? "accent" : "outline"} icon={urgent ? AlertTriangle : Clock}>
              {daysLabel(expiry.daysUntilExpiry)}
            </Tag>
          </Link>
        );
      })}
    </div>
  );
}
