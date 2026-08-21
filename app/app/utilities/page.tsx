import { Gauge } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getUtilities } from "@/lib/queries/utilities";
import { UtilitiesSubNav } from "@/components/utilities/UtilitiesSubNav";
import { UtilityTable } from "@/components/utilities/UtilityTable";
import { UtilityFilters } from "@/components/utilities/UtilityFilters";
import { CreateUtilityDialog } from "@/components/utilities/CreateUtilityDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface UtilitiesPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function UtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<UtilitiesPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, canWrite] = await Promise.all([
    getUtilities({
      organizationId,
      search: params.q,
      status: params.status as "active" | "inactive" | undefined,
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
    return search ? `/app/utilities?${search}` : "/app/utilities";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontFamily: "var(--font-heading)", fontWeight: 700 }}>Utilities &amp; Meters</h1>
        {canWrite ? <CreateUtilityDialog /> : null}
      </div>
      <p style={{ color: "var(--color-neutral-700)", fontSize: 13, margin: "0 0 20px" }}>
        Utility types billed to tenants, and how each is configured per property or unit.
      </p>

      <UtilitiesSubNav active="utilities" />
      <UtilityFilters />

      {result.utilities.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title={hasFilters ? "No utilities match your filters" : "No utilities yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Add your first utility type — electricity, water, or maintenance."}
          action={undefined}
        />
      ) : (
        <>
          <UtilityTable utilities={result.utilities} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
