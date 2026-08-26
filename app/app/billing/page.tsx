import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getBillingRuns, type BillingRunStatus } from "@/lib/queries/billingRuns";
import { getBillStatusCounts } from "@/lib/queries/bills";
import { BillingDashboardTiles } from "@/components/billing/BillingDashboardTiles";
import { BillingRunTable } from "@/components/billing/BillingRunTable";
import { BillingRunFilters } from "@/components/billing/BillingRunFilters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface BillingPageSearchParams {
  status?: string;
  page?: string;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<BillingPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [counts, result, canWrite] = await Promise.all([
    getBillStatusCounts(organizationId),
    getBillingRuns({
      organizationId,
      status: params.status as BillingRunStatus | undefined,
      page,
    }),
    canWriteOrganization(organizationId),
  ]);

  const hasFilters = Boolean(params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/billing?${search}` : "/app/billing";
  }

  return (
    <div>
      <BillingDashboardTiles counts={counts} />

      <div style={{ display: "flex", justifyContent: "flex-end", margin: "20px 0 16px" }}>
        <Link href="/app/billing/bills" style={{ marginRight: 10 }}>
          <Button variant="secondary">
            <FileSignature width={16} height={16} aria-hidden="true" />
            View All Bills
          </Button>
        </Link>
        {canWrite ? (
          <Link href="/app/billing/runs/new">
            <Button variant="primary">
              <Plus width={16} height={16} aria-hidden="true" />
              Run Billing
            </Button>
          </Link>
        ) : null}
      </div>

      <BillingRunFilters />

      {result.runs.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={hasFilters ? "No billing runs match your filters" : "No billing runs yet"}
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Run billing to generate bills for your active occupancies."
          }
          action={
            !hasFilters && canWrite ? (
              <Link href="/app/billing/runs/new">
                <Button variant="primary">
                  <Plus width={16} height={16} aria-hidden="true" />
                  Run Billing
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <BillingRunTable runs={result.runs} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
