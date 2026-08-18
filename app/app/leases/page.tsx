import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLeases, type LeaseStatus } from "@/lib/queries/leases";
import { LeaseTable } from "@/components/leases/LeaseTable";
import { LeaseFilters } from "@/components/leases/LeaseFilters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface LeasesPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<LeasesPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, canWrite] = await Promise.all([
    getLeases({
      organizationId,
      search: params.q,
      status: params.status as LeaseStatus | undefined,
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
    return search ? `/app/leases?${search}` : "/app/leases";
  }

  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Link href="/app/leases/new">
            <Button variant="primary">
              <Plus width={16} height={16} aria-hidden="true" />
              Add Lease
            </Button>
          </Link>
        </div>
      ) : null}

      <LeaseFilters />

      {result.leases.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={hasFilters ? "No leases match your filters" : "No leases yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Create your first lease to link a tenant to a unit."
          }
          action={
            !hasFilters && canWrite ? (
              <Link href="/app/leases/new">
                <Button variant="primary">
                  <Plus width={16} height={16} aria-hidden="true" />
                  Add Lease
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <LeaseTable leases={result.leases} />
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
