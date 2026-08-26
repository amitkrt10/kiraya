import Link from "next/link";
import { Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TenantStatusTag } from "./TenantStatusTag";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import { getInitials } from "@/lib/utils/initials";
import styles from "./TenantHeaderBand.module.css";

export function TenantHeaderBand({
  tenant,
  currentLease,
  activeLeaseCount,
  canWrite,
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
  activeLeaseCount: number;
  canWrite: boolean;
}) {
  const contact = [tenant.phone, tenant.email].filter(Boolean).join(" · ");
  const unitContext =
    activeLeaseCount > 1
      ? `${activeLeaseCount} active units`
      : currentLease?.units
        ? `${currentLease.units.properties?.name ?? ""} · ${currentLease.units.unit_code}`
        : "No active unit";

  return (
    <div className={styles.band}>
      <div className={styles.identity}>
        <div className={styles.avatar}>{getInitials(tenant.display_name)}</div>
        <div>
          <div className={styles.titleRow}>
            <div className={styles.name}>{tenant.display_name}</div>
            <TenantStatusTag status={tenant.status} />
          </div>
          <div className={styles.meta}>
            {[unitContext, contact].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        {currentLease && activeLeaseCount === 1 ? (
          <Link href={`/app/units/${currentLease.unit_id}`}>
            <Button variant="secondary">
              <FileText width={16} height={16} aria-hidden="true" />
              View Unit
            </Button>
          </Link>
        ) : null}
        {canWrite ? (
          <Link href={`/app/tenants/${tenant.id}/edit`}>
            <Button variant="secondary">
              <Pencil width={16} height={16} aria-hidden="true" />
              Edit Tenant
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
