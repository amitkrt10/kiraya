import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLease } from "@/lib/queries/leases";
import { getTenantExitForLease } from "@/lib/queries/tenantExits";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Step1Initiation } from "@/components/tenantExits/steps/Step1Initiation";
import { isUuid } from "@/lib/utils/uuid";
import Link from "next/link";

export default async function NewTenantExitPage({ searchParams }: { searchParams: Promise<{ leaseId?: string }> }) {
  const { leaseId } = await searchParams;
  if (!leaseId || !isUuid(leaseId)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);
  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to initiate a tenant exit in this organization." />;
  }

  const lease = await getLease(leaseId, organizationId);
  if (!lease) {
    notFound();
  }

  // tenant_exits_active_lease_unique_idx allows only one INITIATED/PENDING_SETTLEMENT
  // exit per lease — if one already exists, resume it instead of starting another.
  const existingExit = await getTenantExitForLease(leaseId, organizationId);
  if (existingExit && (existingExit.status === "INITIATED" || existingExit.status === "PENDING_SETTLEMENT")) {
    return (
      <div style={{ maxWidth: 640, padding: 32 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
          An exit is already in progress for this lease
        </div>
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 16 }}>
          {existingExit.exit_reference} is already {existingExit.status === "INITIATED" ? "initiated" : "pending settlement"}.
        </p>
        <Link href={`/app/exits/${existingExit.id}/review`} className="btn btn-primary">
          Continue that exit
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, padding: "32px 40px" }}>
      <Step1Initiation lease={lease} />
    </div>
  );
}
