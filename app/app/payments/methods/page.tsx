import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getPaymentMethods } from "@/lib/queries/paymentMethods";
import { PaymentMethodsTable } from "@/components/payments/PaymentMethodsTable";

export default async function PaymentMethodsPage() {
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [methods, canWrite] = await Promise.all([
    getPaymentMethods(organizationId),
    canWriteOrganization(organizationId),
  ]);

  return <PaymentMethodsTable methods={methods} canWrite={canWrite} />;
}
