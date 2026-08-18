import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenant } from "@/lib/queries/tenants";
import { updateTenantAction } from "@/lib/actions/tenants";
import { TenantForm } from "@/components/tenants/TenantForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { isUuid } from "@/lib/utils/uuid";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [tenant, canWrite] = await Promise.all([
    getTenant(id, organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!tenant) {
    notFound();
  }

  if (!canWrite) {
    return (
      <PermissionDenied description="You don't have permission to edit tenants in this organization." />
    );
  }

  return (
    <Card>
      <TenantForm
        action={updateTenantAction.bind(null, tenant.id)}
        tenant={tenant}
        cancelHref={`/app/tenants/${tenant.id}`}
        submitLabel="Save Changes"
      />
    </Card>
  );
}
