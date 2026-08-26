import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DetailRows } from "@/components/ui/DetailRows";
import { AssignTenantDrawer } from "./AssignTenantDrawer";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import styles from "@/components/tenants/TenantOverview.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * P6.3-C: replaces UnitCurrentLease's role on Unit Detail — "Current
 * Tenant", not "Current Lease". kiraya.leases remains the internal
 * occupancy record (unchanged), but nothing here shows the word "Lease"
 * to the user. The existing /app/leases/* routes and Lease UI are left
 * completely in place (P6.3-C explicitly keeps both workflows side by
 * side) — this component just stops being the thing that surfaces Lease
 * language on the Unit page.
 */
export function UnitCurrentTenant({
  unitId,
  isAssignable,
  currentLease,
  currentRent,
  depositRequired,
  depositHeld,
  tenants,
  canWrite,
}: {
  unitId: string;
  isAssignable: boolean;
  currentLease: LeaseListItem | null;
  currentRent: number | null;
  depositRequired: number | null;
  depositHeld: number | null;
  tenants: TenantPickerItem[];
  canWrite: boolean;
}) {
  if (currentLease) {
    const rows = [
      { label: "Tenant Code", value: currentLease.tenants?.tenant_code ?? "" },
      { label: "Occupancy Since", value: currentLease.occupancy_start_date },
      {
        label: "Current Rent",
        value: currentRent != null ? formatCurrency(currentRent, currentLease.currency_code) : "",
      },
      {
        label: "Deposit",
        value:
          depositRequired != null
            ? `${formatCurrency(depositHeld ?? 0, currentLease.currency_code)} held of ${formatCurrency(depositRequired, currentLease.currency_code)}`
            : "",
      },
    ].filter((row) => row.value.trim().length > 0);

    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className={styles.heading} style={{ marginBottom: 0 }}>
            Current Tenant
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          {currentLease.tenants?.display_name ?? "—"}
        </div>
        <DetailRows rows={rows} bordered={false} />
        <div style={{ marginTop: 12 }}>
          <Link href={`/app/tenants/${currentLease.tenant_id}`}>
            <Button variant="secondary">
              <User width={16} height={16} aria-hidden="true" />
              View Tenant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
      <div>
        <div className={styles.heading} style={{ marginBottom: 4 }}>
          Current Tenant
        </div>
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
          {isAssignable ? "Vacant." : "This unit isn't currently assignable."}
        </p>
      </div>
      {canWrite && isAssignable ? (
        <AssignTenantDrawer unitId={unitId} tenants={tenants} />
      ) : null}
    </div>
  );
}
