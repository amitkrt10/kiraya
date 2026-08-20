import { FileText } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { getBills, type BillStatus } from "@/lib/queries/bills";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { BillTable } from "@/components/billing/BillTable";
import { BillFilters } from "@/components/billing/BillFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface BillsPageSearchParams {
  q?: string;
  status?: string;
  property?: string;
  page?: string;
}

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<BillsPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [properties, result] = await Promise.all([
    getPropertiesForPicker(organizationId),
    getBills({
      organizationId,
      search: params.q,
      status: params.status as BillStatus | undefined,
      propertyId: params.property,
      page,
    }),
  ]);

  const hasFilters = Boolean(params.q || params.status || params.property);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.property) query.set("property", params.property);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/billing/bills?${search}` : "/app/billing/bills";
  }

  return (
    <div>
      <BillFilters properties={properties} />

      {result.bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "No bills match your filters" : "No bills yet"}
          description={
            hasFilters ? "Try adjusting your search or filters." : "Run billing to generate the first bills."
          }
        />
      ) : (
        <>
          <BillTable bills={result.bills} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
