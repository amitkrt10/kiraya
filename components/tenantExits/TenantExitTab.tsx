import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TenantExitStatusTag } from "./TenantExitStatusTag";
import { resolveReachableStep, EXIT_STEPS } from "@/lib/tenantExitSteps";
import type { TenantExitRow, ExitSettlementRow } from "@/lib/queries/tenantExits";

export function TenantExitTab({
  currentLeaseId,
  exit,
  settlement,
  canWrite,
}: {
  currentLeaseId: string | null;
  exit: TenantExitRow | null;
  settlement: ExitSettlementRow | null;
  canWrite: boolean;
}) {
  if (!exit) {
    if (!currentLeaseId) {
      return (
        <EmptyState
          icon={DoorOpen}
          title="No active occupancy"
          description="This tenant has no active occupancy here, so an exit cannot be started."
        />
      );
    }
    return (
      <EmptyState
        icon={DoorOpen}
        title="No tenant exit on file"
        description="Start a tenant exit once the tenant has given notice or a move-out date is confirmed."
        action={
          canWrite ? (
            <Link href={`/app/exits/new?leaseId=${currentLeaseId}`} className="btn btn-primary">
              Start Tenant Exit
            </Link>
          ) : undefined
        }
      />
    );
  }

  const reachable = resolveReachableStep(exit, settlement);
  const reachableSlug = EXIT_STEPS.find((s) => s.n === reachable)?.slug ?? "review";
  const isInProgress = exit.status === "INITIATED" || exit.status === "PENDING_SETTLEMENT";

  return (
    <div className="card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{exit.exit_reference}</div>
        <TenantExitStatusTag status={exit.status} />
      </div>
      <Link href={`/app/exits/${exit.id}/${reachableSlug}`} className="btn btn-primary">
        {isInProgress ? "Continue Exit" : "View Exit"}
      </Link>
    </div>
  );
}
