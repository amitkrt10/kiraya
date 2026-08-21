import Link from "next/link";
import { Gauge } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getMeters } from "@/lib/queries/meters";
import { getUtilitiesForPicker } from "@/lib/queries/utilities";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getUnitsForPicker } from "@/lib/queries/units";
import { UtilitiesSubNav } from "@/components/utilities/UtilitiesSubNav";
import { MeterTable } from "@/components/meters/MeterTable";
import { MeterFilters } from "@/components/meters/MeterFilters";
import { CreateMeterDialog } from "@/components/meters/CreateMeterDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface MetersPageSearchParams {
  q?: string;
  utility?: string;
  status?: string;
  page?: string;
}

export default async function MetersPage({
  searchParams,
}: {
  searchParams: Promise<MetersPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, utilities, properties, units, canWrite] = await Promise.all([
    getMeters({
      organizationId,
      search: params.q,
      utilityId: params.utility,
      status: params.status as "active" | "inactive" | undefined,
      page,
    }),
    getUtilitiesForPicker(organizationId),
    getPropertiesForPicker(organizationId),
    getUnitsForPicker(organizationId),
    canWriteOrganization(organizationId),
  ]);

  const hasFilters = Boolean(params.q || params.utility || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.utility) query.set("utility", params.utility);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/meters?${search}` : "/app/meters";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontFamily: "var(--font-heading)", fontWeight: 700 }}>Utilities &amp; Meters</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {canWrite ? (
            <Link href="/app/meters/batch" className="btn btn-secondary">
              Batch Reading
            </Link>
          ) : null}
          {canWrite ? <CreateMeterDialog utilities={utilities} properties={properties} units={units} /> : null}
        </div>
      </div>
      <p style={{ color: "var(--color-neutral-700)", fontSize: 13, margin: "0 0 20px" }}>Meters installed across your properties, and their latest readings.</p>

      <UtilitiesSubNav active="meters" />
      <MeterFilters utilities={utilities} />

      {result.meters.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title={hasFilters ? "No meters match your filters" : "No meters installed yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Meters recorded for any property in this organization appear here."}
        />
      ) : (
        <>
          <MeterTable meters={result.meters} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
