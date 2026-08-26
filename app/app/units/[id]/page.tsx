import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getUnit, isUnitAssignable } from "@/lib/queries/units";
import { getUnitTypes } from "@/lib/queries/unitTypes";
import { getUnitCurrentLease, getUnitLeases } from "@/lib/queries/leases";
import { getActiveTenantsForPicker } from "@/lib/queries/tenants";
import { getLeaseRentRules } from "@/lib/queries/rentRules";
import { getLeaseBillingConfigs } from "@/lib/queries/billingConfigs";
import { getSecurityDepositByLease, getSecurityDepositHeld, getSecurityDepositTransactions } from "@/lib/queries/securityDeposits";
import { getTenantExitForLease, getExitSettlement } from "@/lib/queries/tenantExits";
import { UnitHeaderBand } from "@/components/units/UnitHeaderBand";
import { UnitOverview } from "@/components/units/UnitOverview";
import { UnitCurrentTenant } from "@/components/units/UnitCurrentTenant";
import { UnitOccupancyTabs } from "@/components/units/UnitOccupancyTabs";
import { PastOccupanciesList } from "@/components/units/PastOccupanciesList";
import { isUuid } from "@/lib/utils/uuid";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [unit, unitTypes, currentLease, assignable, canWrite, tenants, unitLeases] = await Promise.all([
    getUnit(id, organizationId),
    getUnitTypes(organizationId),
    getUnitCurrentLease(id, organizationId),
    isUnitAssignable(id),
    canWriteOrganization(organizationId),
    getActiveTenantsForPicker(organizationId),
    getUnitLeases(id, organizationId),
  ]);
  const pastLeases = unitLeases.filter((lease) => lease.status === "ENDED");

  if (!unit) {
    notFound();
  }

  // Current rent/deposit/billing/exit are only meaningful when there's an
  // occupancy to show them for — the same "currentLease ? ... : null"
  // guard P6.2-D1 already established for lease-scoped deposit lookups,
  // now extended to every other per-occupancy section on this page.
  const [rentRules, billingConfigs, deposit, tenantExit] = await Promise.all([
    currentLease ? getLeaseRentRules(currentLease.id, organizationId) : Promise.resolve([]),
    currentLease ? getLeaseBillingConfigs(currentLease.id, organizationId) : Promise.resolve([]),
    currentLease ? getSecurityDepositByLease(currentLease.id, organizationId) : Promise.resolve(null),
    currentLease ? getTenantExitForLease(currentLease.id, organizationId) : Promise.resolve(null),
  ]);
  const currentRent = rentRules.find((rule) => rule.is_active)?.monthly_rent ?? null;
  const [depositHeld, depositTransactions, exitSettlement] = await Promise.all([
    deposit ? getSecurityDepositHeld(deposit.id) : Promise.resolve(0),
    deposit ? getSecurityDepositTransactions(deposit.id, organizationId) : Promise.resolve([]),
    tenantExit ? getExitSettlement(tenantExit.id, organizationId) : Promise.resolve(null),
  ]);

  return (
    <div>
      <UnitHeaderBand unit={unit} unitTypes={unitTypes} canWrite={canWrite} isOccupied={Boolean(currentLease)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        <UnitCurrentTenant
          unitId={unit.id}
          isAssignable={assignable}
          currentLease={currentLease}
          currentRent={currentRent}
          depositRequired={deposit?.required_amount ?? null}
          depositHeld={depositHeld}
          tenants={tenants}
          canWrite={canWrite}
        />
        {currentLease ? (
          <UnitOccupancyTabs
            leaseId={currentLease.id}
            unitId={unit.id}
            tenantId={currentLease.tenant_id}
            lease={currentLease}
            rentRules={rentRules}
            billingConfigs={billingConfigs}
            deposit={deposit}
            depositHeld={depositHeld}
            depositTransactions={depositTransactions}
            tenantExit={tenantExit}
            exitSettlement={exitSettlement}
            canWrite={canWrite}
          />
        ) : null}
        <PastOccupanciesList unitId={unit.id} pastLeases={pastLeases} />
        <UnitOverview unit={unit} isOccupied={Boolean(currentLease)} />
      </div>
    </div>
  );
}
