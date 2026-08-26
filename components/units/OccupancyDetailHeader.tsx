import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DetailRows } from "@/components/ui/DetailRows";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import type { LeaseDetail } from "@/lib/queries/leases";

/**
 * P6.3-J: the header for `/app/units/[id]/occupancies/[leaseId]` — a
 * specific, explicitly-identified occupancy, current or ended. Unlike
 * UnitCurrentTenant (which only ever represents "whichever lease is
 * ACTIVE right now"), this always shows the exact tenant/dates/status
 * belonging to `lease.id`, regardless of whether the unit has since been
 * reassigned to someone else. Never offers Assign Tenant — that's a
 * current-occupancy-only action that belongs on the unit's own page.
 */
export function OccupancyDetailHeader({ unitId, lease }: { unitId: string; lease: LeaseDetail }) {
  const isCurrent = lease.status === "ACTIVE";

  const rows = [
    { label: "Occupancy Start", value: lease.occupancy_start_date },
    { label: "Occupancy End", value: lease.actual_end_date ?? lease.agreement_end_date ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div>
      <Link
        href={`/app/units/${unitId}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 12 }}
      >
        <ArrowLeft width={14} height={14} aria-hidden="true" />
        {lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "Unit"}
      </Link>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "var(--color-neutral-700)",
            }}
          >
            {isCurrent ? "Current Occupancy" : "Past Occupancy"}
          </span>
          <LeaseStatusTag status={lease.status} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          {lease.tenants?.display_name ?? "—"}
        </div>
        <DetailRows rows={rows} bordered={false} />
        {lease.tenants ? (
          <div style={{ marginTop: 12 }}>
            <Link href={`/app/tenants/${lease.tenants.id}`}>
              <Button variant="secondary">
                <User width={16} height={16} aria-hidden="true" />
                View Tenant
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
