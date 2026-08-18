import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { createTenantAction } from "@/lib/actions/tenants";
import { TenantForm } from "@/components/tenants/TenantForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export default async function NewTenantPage() {
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const canWrite = await canWriteOrganization(context.organization.organizationId);
  if (!canWrite) {
    return (
      <PermissionDenied description="You don't have permission to add tenants in this organization." />
    );
  }

  return (
    <Card>
      <TenantForm action={createTenantAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />
    </Card>
  );
}
