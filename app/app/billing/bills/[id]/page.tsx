import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getBill, getBillItems, getBillAdjustments, getBillCreditApplied } from "@/lib/queries/bills";
import { getBillBalance, getBillPaidAmount } from "@/lib/queries/financial";
import { getBillPaymentsApplied } from "@/lib/queries/payments";
import { BillHeaderBand } from "@/components/billing/BillHeaderBand";
import { BillChargesPanel } from "@/components/billing/BillChargesPanel";
import { BillPaymentSummary } from "@/components/billing/BillPaymentSummary";
import { BillPaymentsAppliedTable } from "@/components/billing/BillPaymentsAppliedTable";
import { isUuid } from "@/lib/utils/uuid";

export default async function BillDetailPage({
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

  const [bill, canWrite] = await Promise.all([getBill(id, organizationId), canWriteOrganization(organizationId)]);

  if (!bill) {
    notFound();
  }

  const [items, adjustments, paidAmount, outstanding, creditApplied, paymentsApplied] = await Promise.all([
    getBillItems(id, organizationId),
    getBillAdjustments(id, organizationId),
    getBillPaidAmount(id),
    getBillBalance(id),
    getBillCreditApplied(id, organizationId),
    getBillPaymentsApplied(id, organizationId),
  ]);

  return (
    <div style={{ maxWidth: 920 }}>
      <BillHeaderBand bill={bill} canWrite={canWrite} />
      <div style={{ marginTop: 20 }}>
        <BillChargesPanel bill={bill} items={items} adjustments={adjustments} />
      </div>
      <div style={{ marginTop: 20 }}>
        <BillPaymentSummary bill={bill} paidAmount={paidAmount} outstanding={outstanding} creditApplied={creditApplied} />
      </div>
      <div className="card" style={{ padding: "20px 24px", marginTop: 20 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          Payments Applied
        </div>
        <BillPaymentsAppliedTable payments={paymentsApplied} currencyCode={bill.currency_code} />
      </div>
    </div>
  );
}
