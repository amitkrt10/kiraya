import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getProperty, getPropertyUnitCounts } from "@/lib/queries/properties";
import { getPropertyUnits, getSuggestedUnitCode } from "@/lib/queries/units";
import { getUnitTypes } from "@/lib/queries/unitTypes";
import { getOwners, getPropertyOwnerships } from "@/lib/queries/owners";
import { getUnitCurrentLeasesByIds } from "@/lib/queries/leases";
import { PropertyHeaderBand } from "@/components/properties/PropertyHeaderBand";
import { PropertyTiles } from "@/components/properties/PropertyTiles";
import { PropertyDetailTabs } from "@/components/properties/PropertyDetailTabs";
import { getPropertyTypes } from "@/lib/queries/propertyTypes";
import { isUuid } from "@/lib/utils/uuid";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // A malformed id (e.g. a hand-edited URL) would otherwise crash the `uuid`
  // column comparison in Postgres and surface as a generic error — 404 instead.
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [property, unitCounts, units, unitTypes, propertyTypes, ownerships, owners, canWrite] =
    await Promise.all([
      getProperty(id, organizationId),
      getPropertyUnitCounts(id),
      getPropertyUnits(id, organizationId),
      getUnitTypes(organizationId),
      getPropertyTypes(organizationId),
      getPropertyOwnerships(id, organizationId),
      getOwners(organizationId),
      canWriteOrganization(organizationId),
    ]);

  if (!property) {
    notFound();
  }

  const [currentLeases, suggestedUnitCode] = await Promise.all([
    getUnitCurrentLeasesByIds(
      units.map((unit) => unit.id),
      organizationId,
    ),
    getSuggestedUnitCode(id, property.name),
  ]);

  return (
    <div>
      <PropertyHeaderBand
        property={property}
        ownerships={ownerships}
        propertyTypes={propertyTypes}
        canWrite={canWrite}
      />
      <PropertyTiles counts={unitCounts} />
      <PropertyDetailTabs
        property={property}
        units={units}
        unitTypes={unitTypes}
        currentLeases={currentLeases}
        ownerships={ownerships}
        owners={owners}
        canWrite={canWrite}
        suggestedUnitCode={suggestedUnitCode}
      />
    </div>
  );
}
