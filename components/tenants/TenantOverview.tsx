import { DetailRows } from "@/components/ui/DetailRows";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import styles from "./TenantOverview.module.css";

export function TenantOverview({
  tenant,
  currentLease,
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
}) {
  const leaseRows = currentLease
    ? [
        { label: "Lease Code", value: currentLease.lease_code },
        {
          label: "Property / Unit",
          value: currentLease.units
            ? `${currentLease.units.properties?.name ?? ""} · ${currentLease.units.unit_code}`
            : "",
        },
        { label: "Agreement Start", value: currentLease.agreement_start_date },
        { label: "Agreement End", value: currentLease.agreement_end_date ?? "Open-ended" },
        { label: "Occupancy Start", value: currentLease.occupancy_start_date },
      ]
    : [];

  const contactRows = [
    { label: "Phone", value: tenant.phone ?? "" },
    { label: "Alternate Phone", value: tenant.alternate_phone ?? "" },
    { label: "Email", value: tenant.email ?? "" },
    {
      label: "Address",
      value: [tenant.address_line_1, tenant.city, tenant.state, tenant.postal_code]
        .filter(Boolean)
        .join(", "),
    },
    {
      label: "Emergency Contact",
      value: [tenant.emergency_contact_name, tenant.emergency_contact_phone].filter(Boolean).join(" · "),
    },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        <div className={styles.heading}>Lease Summary</div>
        {currentLease ? (
          <DetailRows rows={leaseRows} bordered={false} />
        ) : (
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No active lease.</p>
        )}
      </div>
      <div className={styles.column}>
        <div className={styles.heading}>Contact Information</div>
        {contactRows.length > 0 ? (
          <DetailRows rows={contactRows} bordered={false} />
        ) : (
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No contact details on file.</p>
        )}
      </div>
    </div>
  );
}
