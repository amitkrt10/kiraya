import { DoorOpen } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { getTenantExits } from "@/lib/queries/tenantExits";
import type { TenantExitStatus } from "@/lib/queries/tenantExits";
import { ExitTable } from "@/components/tenantExits/ExitTable";
import { ExitFilters } from "@/components/tenantExits/ExitFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface ExitsPageSearchParams {
  q?: string;
  status?: string;
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

  const result = await getTenantExits({
    organizationId,
    search: params.q,
    status: params.status as TenantExitStatus | undefined,
    page,
  });

  const hasFilters = Boolean(params.q || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/exits?${search}` : "/app/exits";
  }

  return (
    <div>
      <ExitFilters />

      {result.exits.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title={hasFilters ? "No tenant exits match your filters" : "No tenant exits yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
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
