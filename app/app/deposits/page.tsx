import { Wallet } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { getSecurityDeposits } from "@/lib/queries/securityDeposits";
import type { SecurityDepositStatus } from "@/lib/queries/securityDeposits";
import { DepositTable } from "@/components/securityDeposits/DepositTable";
import { DepositFilters } from "@/components/securityDeposits/DepositFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface DepositsPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function DepositsPage({
  searchParams,
}: {
  searchParams: Promise<DepositsPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const result = await getSecurityDeposits({
    organizationId,
    search: params.q,
    status: params.status as SecurityDepositStatus | undefined,
    page,
  });

  const hasFilters = Boolean(params.q || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/deposits?${search}` : "/app/deposits";
  }

  return (
    <div>
      <DepositFilters />

      {result.deposits.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={hasFilters ? "No deposits match your filters" : "No security deposits yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Security deposits recorded for any tenant in this organization appear here."
          }
        />
      ) : (
        <>
          <DepositTable deposits={result.deposits} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
