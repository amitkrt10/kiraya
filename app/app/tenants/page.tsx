import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenants, type TenantStatus } from "@/lib/queries/tenants";
import { TenantTable } from "@/components/tenants/TenantTable";
import { TenantFilters } from "@/components/tenants/TenantFilters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface TenantsPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<TenantsPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, canWrite] = await Promise.all([
    getTenants({
      organizationId,
      search: params.q,
      status: params.status as TenantStatus | undefined,
      page,
    }),
    canWriteOrganization(organizationId),
  ]);

  const hasFilters = Boolean(params.q || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/tenants?${search}` : "/app/tenants";
  }

  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Link href="/app/tenants/new">
            <Button variant="primary">
              <Plus width={16} height={16} aria-hidden="true" />
              Add Tenant
            </Button>
          </Link>
        </div>
      ) : null}

      <TenantFilters />

      {result.tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No tenants match your filters" : "No tenants yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first tenant to start creating leases."
          }
          action={
            !hasFilters && canWrite ? (
              <Link href="/app/tenants/new">
                <Button variant="primary">
                  <Plus width={16} height={16} aria-hidden="true" />
                  Add Tenant
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <TenantTable tenants={result.tenants} />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            buildHref={buildHref}
          />
        </>
      )}
    </div>
  );
}
