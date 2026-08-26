import { DetailRows } from "@/components/ui/DetailRows";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import { EditOccupancyDrawer } from "./EditOccupancyDrawer";
import type { LeaseRow } from "@/lib/queries/leases";

/**
 * P6.3-F: the Tenant/Unit-facing replacement for /app/leases/[id]/edit's
 * read side (LeaseOverview) — shows exactly the fields the audit found
 * still meaningful. Never lease_code or currency (removed entirely —
 * lease_code is a pure internal id, currency is always INR with no
 * multi-currency UI anywhere). Agreement End Date and Actual End Date
 * are shown read-only, only when a real value exists, per the approved
 * audit decision — not editable here, and not invented as a new
 * "planned end date" feature.
 */
export function UnitOccupancySummary({ leaseId, unitId, lease, canWrite }: { leaseId: string; unitId: string; lease: LeaseRow; canWrite: boolean }) {
  const rows = [
    { label: "Occupancy Start Date", value: lease.occupancy_start_date },
    { label: "Notice Date", value: lease.notice_date ?? "" },
    { label: "Move-in Date", value: lease.move_in_date ?? "" },
    { label: "Move-out Date", value: lease.move_out_date ?? "" },
    { label: "Occupancy End Date (planned)", value: lease.agreement_end_date ?? "" },
    { label: "Actual End Date", value: lease.actual_end_date ?? "" },
    { label: "Notes", value: lease.notes ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-neutral-700)" }}>Occupancy Status</span>
          <LeaseStatusTag status={lease.status} />
        </div>
        {canWrite ? <EditOccupancyDrawer leaseId={leaseId} unitId={unitId} lease={lease} /> : null}
      </div>
      <DetailRows rows={rows} bordered={false} />
    </div>
  );
}
