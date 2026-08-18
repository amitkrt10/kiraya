import { Building2 } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getProperties, type PropertyStatus } from "@/lib/queries/properties";
import { getPropertyTypes } from "@/lib/queries/propertyTypes";
import { PropertyTable } from "@/components/properties/PropertyTable";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PropertyFormDrawer } from "@/components/properties/PropertyFormDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface PropertiesPageSearchParams {
  q?: string;
  type?: string;
  status?: string;
  page?: string;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<PropertiesPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    // Defensive only — app/app/layout.tsx already gates on this.
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [propertyTypes, result, canWrite] = await Promise.all([
    getPropertyTypes(organizationId),
    getProperties({
      organizationId,
      search: params.q,
      propertyTypeId: params.type,
      status: params.status as PropertyStatus | undefined,
      page,
    }),
    canWriteOrganization(organizationId),
  ]);

  const hasFilters = Boolean(params.q || params.type || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/properties?${search}` : "/app/properties";
  }

  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <PropertyFormDrawer mode="create" propertyTypes={propertyTypes} />
        </div>
      ) : null}

      <PropertyFilters propertyTypes={propertyTypes} />

      {result.properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No properties match your filters" : "No properties yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first property to start tracking units, owners, and tenants."
          }
          action={
            !hasFilters && canWrite ? (
              <PropertyFormDrawer mode="create" propertyTypes={propertyTypes} />
            ) : undefined
          }
        />
      ) : (
        <>
          <PropertyTable properties={result.properties} />
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
