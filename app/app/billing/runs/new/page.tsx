import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { GenerateBillingRunForm } from "@/components/billing/GenerateBillingRunForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export default async function NewBillingRunPage() {
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);
  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to run billing in this organization." />;
  }

  const properties = await getPropertiesForPicker(organizationId);

  return (
    <Card>
      <GenerateBillingRunForm properties={properties} />
    </Card>
  );
}
