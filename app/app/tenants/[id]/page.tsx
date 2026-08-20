import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenant } from "@/lib/queries/tenants";
import { getTenantLeases } from "@/lib/queries/leases";
import { getTenantBills } from "@/lib/queries/bills";
import { TenantHeaderBand } from "@/components/tenants/TenantHeaderBand";
import { TenantTiles } from "@/components/tenants/TenantTiles";
import { TenantDetailTabs } from "@/components/tenants/TenantDetailTabs";
import { isUuid } from "@/lib/utils/uuid";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [tenant, leases, bills, canWrite] = await Promise.all([
    getTenant(id, organizationId),
    getTenantLeases(id, organizationId),
    getTenantBills(id, organizationId),
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
      <TenantTiles tenant={tenant} activeLeaseCount={activeLeaseCount} currentLease={currentLease} />
      <TenantDetailTabs tenant={tenant} currentLease={currentLease} leases={leases} bills={bills} />
    </div>
  );
}
