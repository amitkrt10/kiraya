import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenantsForPicker } from "@/lib/queries/tenants";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getUnitsForPicker } from "@/lib/queries/units";
import { LeaseCreateForm } from "@/components/leases/LeaseCreateForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);
  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to add leases in this organization." />;
  }

  const [tenants, properties, units] = await Promise.all([
    getTenantsForPicker(organizationId),
    getPropertiesForPicker(organizationId),
    getUnitsForPicker(organizationId),
  ]);

  return (
    <Card>
      <LeaseCreateForm
        tenants={tenants}
        properties={properties}
        units={units}
        preselectedUnitId={params.unitId}
      />
    </Card>
  );
}
