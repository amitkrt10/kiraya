import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getTenantsForPicker } from "@/lib/queries/tenants";
import { getActivePaymentMethodsForPicker } from "@/lib/queries/paymentMethods";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);
  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to record payments in this organization." />;
  }

  const [tenants, methods] = await Promise.all([
    getTenantsForPicker(organizationId),
    getActivePaymentMethodsForPicker(organizationId),
  ]);

  return (
    <Card>
      <PaymentForm tenants={tenants} methods={methods} preselectedTenantId={params.tenantId} />
    </Card>
  );
}
