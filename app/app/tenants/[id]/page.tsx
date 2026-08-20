import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenant } from "@/lib/queries/tenants";
import { getTenantLeases } from "@/lib/queries/leases";
import { getTenantBills } from "@/lib/queries/bills";
import { getTenantPayments } from "@/lib/queries/payments";
import { getTenantOutstanding, getTenantCredit } from "@/lib/queries/financial";
import { getLedgerEntries } from "@/lib/queries/ledger";
import { TenantHeaderBand } from "@/components/tenants/TenantHeaderBand";
import { TenantTiles } from "@/components/tenants/TenantTiles";
import { TenantDetailTabs } from "@/components/tenants/TenantDetailTabs";
import { isUuid } from "@/lib/utils/uuid";

interface TenantDetailSearchParams {
  ledgerPage?: string;
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<TenantDetailSearchParams>;
}) {
  const { id } = await params;
  const { ledgerPage } = await searchParams;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const ledgerPageNumber = Number(ledgerPage) > 0 ? Number(ledgerPage) : 1;

  const [tenant, leases, bills, payments, outstanding, credit, ledger, canWrite] = await Promise.all([
    getTenant(id, organizationId),
    getTenantLeases(id, organizationId),
    getTenantBills(id, organizationId),
    getTenantPayments(id, organizationId),
    getTenantOutstanding(id),
    getTenantCredit(id),
    getLedgerEntries({ organizationId, tenantId: id, page: ledgerPageNumber }),
    canWriteOrganization(organizationId),
  ]);

  if (!tenant) {
    notFound();
  }

  const currentLease = leases.find((lease) => lease.status === "ACTIVE") ?? null;
  const activeLeaseCount = leases.filter((lease) => lease.status === "ACTIVE").length;

  return (
    <div>
      <TenantHeaderBand tenant={tenant} currentLease={currentLease} canWrite={canWrite} />
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
        leases={leases}
        bills={bills}
        payments={payments}
        ledger={ledger}
      />
    </div>
  );
}
