import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenant } from "@/lib/queries/tenants";
import { getTenantLeases } from "@/lib/queries/leases";
import { getTenantBills } from "@/lib/queries/bills";
import { getTenantPayments } from "@/lib/queries/payments";
import { getTenantOutstanding, getTenantCredit } from "@/lib/queries/financial";
import { getLedgerEntries } from "@/lib/queries/ledger";
import { getLeaseRentRules } from "@/lib/queries/rentRules";
import { getSecurityDepositByLease, getSecurityDepositHeld, getSecurityDepositTransactions } from "@/lib/queries/securityDeposits";
import { getTenantExitForTenant, getExitSettlement } from "@/lib/queries/tenantExits";
import { getTenantContacts } from "@/lib/queries/tenantContacts";
import { TenantHeaderBand } from "@/components/tenants/TenantHeaderBand";
import { TenantTiles } from "@/components/tenants/TenantTiles";
import { TenantDetailTabs } from "@/components/tenants/TenantDetailTabs";
import type { TenantUnitOccupancyDetail } from "@/components/tenants/TenantOverview";
import type { LeaseListItem } from "@/lib/queries/leases";
import { isUuid } from "@/lib/utils/uuid";

/**
 * P6.3-D Part 4: one row per ACTIVE unit this tenant holds — never a
 * single tenant-level rent/deposit. A tenant typically holds a handful of
 * units at most, so a per-lease Promise.all here (rather than a new
 * batched RPC) matches the existing getPropertyUnitCounts-style tradeoff
 * of simplicity over premature batching at this scale.
 */
async function getActiveUnitOccupancyDetails(
  activeLeases: LeaseListItem[],
  organizationId: string,
): Promise<Record<string, TenantUnitOccupancyDetail>> {
  const entries = await Promise.all(
    activeLeases.map(async (lease) => {
      const [rentRules, deposit] = await Promise.all([
        getLeaseRentRules(lease.id, organizationId),
        getSecurityDepositByLease(lease.id, organizationId),
      ]);
      const depositHeld = deposit ? await getSecurityDepositHeld(deposit.id) : null;
      const currentRent = rentRules.find((rule) => rule.is_active)?.monthly_rent ?? null;
      return [
        lease.id,
        {
          currentRent,
          depositRequired: deposit?.required_amount ?? null,
          depositHeld,
          currencyCode: lease.currency_code,
        },
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}

interface TenantDetailSearchParams {
  ledgerPage?: string;
  unit?: string;
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<TenantDetailSearchParams>;
}) {
  const { id } = await params;
  const { ledgerPage, unit } = await searchParams;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const ledgerPageNumber = Number(ledgerPage) > 0 ? Number(ledgerPage) : 1;

  const [tenant, leases, bills, payments, outstanding, credit, ledger, tenantExit, contacts, canWrite] = await Promise.all([
    getTenant(id, organizationId),
    getTenantLeases(id, organizationId),
    getTenantBills(id, organizationId),
    getTenantPayments(id, organizationId),
    getTenantOutstanding(id),
    getTenantCredit(id),
    getLedgerEntries({ organizationId, tenantId: id, unitId: unit, page: ledgerPageNumber }),
    getTenantExitForTenant(id, organizationId),
    getTenantContacts(id, organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!tenant) {
    notFound();
  }

  const currentLease = leases.find((lease) => lease.status === "ACTIVE") ?? null;
  const activeLeaseCount = leases.filter((lease) => lease.status === "ACTIVE").length;

  // Deposit is always resolved by a specific lease_id, never by tenant_id —
  // a multi-unit tenant can hold a separate deposit per lease, so picking
  // "the tenant's" deposit without a lease is ambiguous by construction.
  // While occupying, that's the current active lease. Once fully exited
  // (no active lease), fall back to the most recent exit's own lease_id —
  // deterministic (the exit already identifies exactly which occupancy it
  // was for), and what actually lets a completed exit's historical
  // deposit/REFUND transaction history keep showing here afterward.
  const depositLeaseId = currentLease?.id ?? tenantExit?.lease_id ?? null;
  const [deposit, exitSettlement] = await Promise.all([
    depositLeaseId ? getSecurityDepositByLease(depositLeaseId, organizationId) : Promise.resolve(null),
    tenantExit ? getExitSettlement(tenantExit.id, organizationId) : Promise.resolve(null),
  ]);

  const [depositHeld, depositTransactions] = await Promise.all([
    deposit ? getSecurityDepositHeld(deposit.id) : Promise.resolve(0),
    deposit ? getSecurityDepositTransactions(deposit.id, organizationId) : Promise.resolve([]),
  ]);

  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE");
  const unitDetails = await getActiveUnitOccupancyDetails(activeLeases, organizationId);

  return (
    <div>
      <TenantHeaderBand tenant={tenant} currentLease={currentLease} activeLeaseCount={activeLeaseCount} canWrite={canWrite} />
      <TenantTiles
        tenant={tenant}
        activeLeaseCount={activeLeaseCount}
        currentLease={currentLease}
        outstanding={outstanding}
        credit={credit}
      />
      <TenantDetailTabs
        tenant={tenant}
        currentLease={currentLease}
        activeLeaseCount={activeLeaseCount}
        leases={leases}
        unitDetails={unitDetails}
        bills={bills}
        payments={payments}
        ledger={ledger}
        deposit={deposit}
        depositHeld={depositHeld}
        depositTransactions={depositTransactions}
        tenantExit={tenantExit}
        exitSettlement={exitSettlement}
        contacts={contacts}
        canWrite={canWrite}
      />
    </div>
  );
}
