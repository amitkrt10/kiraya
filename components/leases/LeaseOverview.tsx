import { DetailRows } from "@/components/ui/DetailRows";
import type { LeaseDetail } from "@/lib/queries/leases";
import styles from "@/components/tenants/TenantOverview.module.css";

export function LeaseOverview({ lease }: { lease: LeaseDetail }) {
  const termRows = [
    { label: "Agreement Start", value: lease.agreement_start_date },
    { label: "Agreement End", value: lease.agreement_end_date ?? "Open-ended" },
    { label: "Occupancy Start", value: lease.occupancy_start_date },
    { label: "Actual End", value: lease.actual_end_date ?? "" },
    { label: "Notice Date", value: lease.notice_date ?? "" },
    { label: "Move-in Date", value: lease.move_in_date ?? "" },
    { label: "Move-out Date", value: lease.move_out_date ?? "" },
    { label: "Currency", value: lease.currency_code },
  ].filter((row) => row.value.trim().length > 0);

  const partyRows = [
    { label: "Tenant", value: lease.tenants ? `${lease.tenants.display_name} (${lease.tenants.tenant_code})` : "" },
    {
      label: "Property / Unit",
      value: lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "",
    },
    { label: "Notes", value: lease.notes ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        <div className={styles.heading}>Lease Terms</div>
        <DetailRows rows={termRows} bordered={false} />
      </div>
      <div className={styles.column}>
        <div className={styles.heading}>Party &amp; Unit</div>
        <DetailRows rows={partyRows} bordered={false} />
      </div>
    </div>
  );
}
