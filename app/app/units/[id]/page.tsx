import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getUnit } from "@/lib/queries/units";
import { getUnitTypes } from "@/lib/queries/unitTypes";
import { getUnitCurrentLease } from "@/lib/queries/leases";
import { UnitHeaderBand } from "@/components/units/UnitHeaderBand";
import { UnitOverview } from "@/components/units/UnitOverview";
import { UnitCurrentLease } from "@/components/units/UnitCurrentLease";
import { isUuid } from "@/lib/utils/uuid";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [unit, unitTypes, currentLease, canWrite] = await Promise.all([
    getUnit(id, organizationId),
    getUnitTypes(organizationId),
    getUnitCurrentLease(id, organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!unit) {
    notFound();
  }

  return (
    <div>
      <UnitHeaderBand unit={unit} unitTypes={unitTypes} canWrite={canWrite} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        <UnitCurrentLease unitId={unit.id} currentLease={currentLease} canWrite={canWrite} />
        <UnitOverview unit={unit} />
      </div>
    </div>
  );
}
