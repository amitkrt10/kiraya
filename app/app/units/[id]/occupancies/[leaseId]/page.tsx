import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLease } from "@/lib/queries/leases";
import { getLeaseRentRules } from "@/lib/queries/rentRules";
import { getLeaseBillingConfigs } from "@/lib/queries/billingConfigs";
import { getSecurityDepositByLease, getSecurityDepositHeld, getSecurityDepositTransactions } from "@/lib/queries/securityDeposits";
import { getTenantExitForLease, getExitSettlement } from "@/lib/queries/tenantExits";
import { getLeaseBills } from "@/lib/queries/bills";
import { getLedgerEntries } from "@/lib/queries/ledger";
import { OccupancyDetailHeader } from "@/components/units/OccupancyDetailHeader";
import { UnitOccupancyTabs } from "@/components/units/UnitOccupancyTabs";
import { isUuid } from "@/lib/utils/uuid";

/**
 * P6.3-J: the exact-occupancy counterpart to `/app/units/[id]`, which
 * only ever represents "whichever lease is ACTIVE on this unit right
 * now." This page always represents `leaseId` itself — current or
 * ended — and never silently substitutes a different occupancy, which
 * is the P6.3-I audit's core finding: a reassigned unit's old occupancy
 * URL used to redirect into the unit's *current* tenant's data with no
 * indication anything had been substituted. getLease() has no status
 * filter and is scoped by id + organization_id (RLS-backed, same
 * not-found-vs-leak pattern as every other detail query in this
 * codebase) — it resolves this exact lease or nothing at all.
 */
export default async function UnitOccupancyDetailPage({
  params,
}: {
  params: Promise<{ id: string; leaseId: string }>;
}) {
  const { id: unitId, leaseId } = await params;
  if (!isUuid(unitId) || !isUuid(leaseId)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const lease = await getLease(leaseId, organizationId);
  // Requirements 1-3: exists, belongs to this org (getLease is
  // org-scoped), and belongs to the requested unit specifically — never
  // just "some lease in this org," and never resolved via unit_id at all
  // (so a reassigned unit's new occupancy can never be substituted here).
  if (!lease || lease.unit_id !== unitId) {
    notFound();
  }

  const canWrite = await canWriteOrganization(organizationId);
  // Requirement 6 / Part 10: only the unit's own current ACTIVE lease is
  // writable through this route — an ended (or draft/cancelled) occupancy
  // is always read-only here, regardless of the viewer's permissions.
  const effectiveCanWrite = canWrite && lease.status === "ACTIVE";

  const [rentRules, billingConfigs, deposit, tenantExit, bills] = await Promise.all([
    getLeaseRentRules(leaseId, organizationId),
    getLeaseBillingConfigs(leaseId, organizationId),
    getSecurityDepositByLease(leaseId, organizationId),
    getTenantExitForLease(leaseId, organizationId),
    getLeaseBills(leaseId, organizationId),
  ]);

  const [depositHeld, depositTransactions, exitSettlement, ledger] = await Promise.all([
    deposit ? getSecurityDepositHeld(deposit.id) : Promise.resolve(0),
    deposit ? getSecurityDepositTransactions(deposit.id, organizationId) : Promise.resolve([]),
    tenantExit ? getExitSettlement(tenantExit.id, organizationId) : Promise.resolve(null),
    getLedgerEntries({ organizationId, leaseId, pageSize: 100 }),
  ]);

  return (
    <div>
      <OccupancyDetailHeader unitId={unitId} lease={lease} />
      <div style={{ marginTop: 20 }}>
        <UnitOccupancyTabs
          leaseId={lease.id}
          unitId={unitId}
          tenantId={lease.tenant_id}
          lease={lease}
          rentRules={rentRules}
          billingConfigs={billingConfigs}
          deposit={deposit}
          depositHeld={depositHeld}
          depositTransactions={depositTransactions}
          tenantExit={tenantExit}
          exitSettlement={exitSettlement}
          canWrite={effectiveCanWrite}
          bills={bills}
          ledgerEntries={ledger.entries}
        />
      </div>
    </div>
  );
}
