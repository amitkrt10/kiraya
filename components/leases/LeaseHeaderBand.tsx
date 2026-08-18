import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LeaseStatusTag } from "./LeaseStatusTag";
import type { LeaseDetail } from "@/lib/queries/leases";
import styles from "@/components/properties/PropertyHeaderBand.module.css";

export function LeaseHeaderBand({ lease, canWrite }: { lease: LeaseDetail; canWrite: boolean }) {
  return (
    <div className={styles.band}>
      <div>
        <div className={styles.titleRow}>
          <div className={styles.name}>{lease.lease_code}</div>
          <LeaseStatusTag status={lease.status} />
        </div>
        <div className={styles.meta}>
          {lease.tenants ? (
            <Link href={`/app/tenants/${lease.tenants.id}`}>{lease.tenants.display_name}</Link>
          ) : (
            "—"
          )}
          {" · "}
          {lease.units ? (
            <Link href={`/app/units/${lease.units.id}`}>
              {lease.units.properties?.name ?? ""} · {lease.units.unit_code}
            </Link>
          ) : (
            "—"
          )}
        </div>
      </div>
      {canWrite ? (
        <Link href={`/app/leases/${lease.id}/edit`}>
          <Button variant="secondary">
            <Pencil width={16} height={16} aria-hidden="true" />
            Edit Lease
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
