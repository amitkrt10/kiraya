import { DoorOpen } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenantExits, getEligibleLeasesForExit } from "@/lib/queries/tenantExits";
import type { TenantExitStatus } from "@/lib/queries/tenantExits";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getUnitsForPicker } from "@/lib/queries/units";
import { getTenantsForPicker } from "@/lib/queries/tenants";
import { ExitTable } from "@/components/tenantExits/ExitTable";
import { ExitFilters } from "@/components/tenantExits/ExitFilters";
import { NewExitDrawer } from "@/components/tenantExits/NewExitDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface ExitsPageSearchParams {
  q?: string;
  status?: string;
  property?: string;
  unit?: string;
  tenant?: string;
  page?: string;
}

export default async function ExitsPage({
  searchParams,
}: {
  searchParams: Promise<ExitsPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, canWrite, properties, units, tenants] = await Promise.all([
    getTenantExits({
      organizationId,
      search: params.q,
      status: params.status as TenantExitStatus | undefined,
      propertyId: params.property,
      unitId: params.unit,
      tenantId: params.tenant,
      page,
    }),
    canWriteOrganization(organizationId),
    getPropertiesForPicker(organizationId),
    getUnitsForPicker(organizationId),
    getTenantsForPicker(organizationId),
  ]);

  // Only fetched for writers — the only audience that can act on it, and
  // read-only users shouldn't pay for a query whose result they'd never see.
  const eligibleLeases = canWrite ? await getEligibleLeasesForExit(organizationId) : [];

  const hasFilters = Boolean(params.q || params.status || params.property || params.unit || params.tenant);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.property) query.set("property", params.property);
    if (params.unit) query.set("unit", params.unit);
    if (params.tenant) query.set("tenant", params.tenant);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/exits?${search}` : "/app/exits";
  }

  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <NewExitDrawer eligibleLeases={eligibleLeases} />
        </div>
      ) : null}

      <ExitFilters properties={properties} units={units} tenants={tenants} />

      {result.exits.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title={hasFilters ? "No tenant exits match your filters" : "No tenant exits yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : canWrite
                ? "Start a tenant exit using the New Exit button above, or from a tenant's own Exit tab."
                : "A tenant exit is started from a tenant's Exit tab once notice is given."
          }
        />
      ) : (
        <>
          <ExitTable exits={result.exits} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
