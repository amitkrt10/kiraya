import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getUnit } from "@/lib/queries/units";
import { getUnitTypes } from "@/lib/queries/unitTypes";
import { UnitHeaderBand } from "@/components/units/UnitHeaderBand";
import { UnitOverview } from "@/components/units/UnitOverview";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [unit, unitTypes, canWrite] = await Promise.all([
    getUnit(id, organizationId),
    getUnitTypes(organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!unit) {
    notFound();
  }

  return (
    <div>
      <UnitHeaderBand unit={unit} unitTypes={unitTypes} canWrite={canWrite} />
      <UnitOverview unit={unit} />
    </div>
  );
}
