import { ScrollText } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { getLedgerEntries, type LedgerEntryType } from "@/lib/queries/ledger";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getTenantsForPicker } from "@/lib/queries/tenants";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { LedgerFilters } from "@/components/ledger/LedgerFilters";
import { LedgerExportButton } from "@/components/ledger/LedgerExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface LedgerPageSearchParams {
  property?: string;
  tenant?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<LedgerPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [properties, tenants, result] = await Promise.all([
    getPropertiesForPicker(organizationId),
    getTenantsForPicker(organizationId),
    getLedgerEntries({
      organizationId,
      propertyId: params.property,
      tenantId: params.tenant,
      entryType: params.type as LedgerEntryType | undefined,
      dateFrom: params.from,
      dateTo: params.to,
      page,
    }),
  ]);

  const hasFilters = Boolean(params.property || params.tenant || params.type || params.from || params.to);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.property) query.set("property", params.property);
    if (params.tenant) query.set("tenant", params.tenant);
    if (params.type) query.set("type", params.type);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/ledger?${search}` : "/app/ledger";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LedgerExportButton
          query={{ property: params.property, tenant: params.tenant, type: params.type, from: params.from, to: params.to }}
        />
      </div>

      <LedgerFilters properties={properties} tenants={tenants} />

      {result.entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={hasFilters ? "No ledger entries match your filters" : "No ledger entries yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Ledger entries appear here once bills are finalized and payments are recorded."
          }
        />
      ) : (
        <>
          <LedgerTable entries={result.entries} showTenantColumn />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
