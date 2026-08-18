import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DetailRows } from "@/components/ui/DetailRows";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import type { LeaseListItem } from "@/lib/queries/leases";
import styles from "@/components/tenants/TenantOverview.module.css";

/**
 * Shown on Unit Detail alongside — never instead of — the unit's own
 * authoritative status column (see UnitTable.tsx for the same rule applied
 * to the Property Detail Units tab).
 */
export function UnitCurrentLease({
  unitId,
  currentLease,
  canWrite,
}: {
  unitId: string;
  currentLease: LeaseListItem | null;
  canWrite: boolean;
}) {
  if (!currentLease) {
    return (
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
        <div>
          <div className={styles.heading} style={{ marginBottom: 4 }}>
            Current Lease
          </div>
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No active lease for this unit.</p>
        </div>
        {canWrite ? (
          <Link href={`/app/leases/new?unitId=${unitId}`}>
            <Button variant="secondary">
              <Plus width={16} height={16} aria-hidden="true" />
              Create Lease
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  const rows = [
    { label: "Tenant", value: currentLease.tenants?.display_name ?? "" },
    { label: "Occupancy Start", value: currentLease.occupancy_start_date },
    { label: "Agreement End", value: currentLease.agreement_end_date ?? "Open-ended" },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className={styles.heading} style={{ marginBottom: 0 }}>
          Current Lease
        </div>
        <LeaseStatusTag status={currentLease.status} />
      </div>
      <DetailRows rows={rows} bordered={false} />
      <div style={{ marginTop: 12 }}>
        <Link href={`/app/leases/${currentLease.id}`}>
          <Button variant="secondary">
            <FileSignature width={16} height={16} aria-hidden="true" />
            View Lease
          </Button>
        </Link>
      </div>
    </div>
  );
}
