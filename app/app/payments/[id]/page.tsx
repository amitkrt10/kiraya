import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getPayment, getPaymentAllocations } from "@/lib/queries/payments";
import { PaymentHeaderBand } from "@/components/payments/PaymentHeaderBand";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { PaymentAllocationsTable } from "@/components/payments/PaymentAllocationsTable";
import { isUuid } from "@/lib/utils/uuid";

export default async function PaymentDetailPage({
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

  const [payment, canWrite] = await Promise.all([getPayment(id, organizationId), canWriteOrganization(organizationId)]);

  if (!payment) {
    notFound();
  }

  const allocations = await getPaymentAllocations(id, organizationId);

  return (
    <div style={{ maxWidth: 920 }}>
      <PaymentHeaderBand payment={payment} canWrite={canWrite} />
      <div style={{ marginTop: 20 }}>
        <PaymentSummary payment={payment} allocations={allocations} />
      </div>
      <div className="card" style={{ padding: "20px 24px", marginTop: 20 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          Allocations
        </div>
        <PaymentAllocationsTable allocations={allocations} currencyCode={payment.currency_code} />
      </div>
    </div>
  );
}
