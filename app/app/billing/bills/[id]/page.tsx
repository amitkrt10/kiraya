import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getBill, getBillItems, getBillAdjustments } from "@/lib/queries/bills";
import { BillHeaderBand } from "@/components/billing/BillHeaderBand";
import { BillChargesPanel } from "@/components/billing/BillChargesPanel";
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

  const [items, adjustments] = await Promise.all([getBillItems(id, organizationId), getBillAdjustments(id, organizationId)]);

  return (
    <div style={{ maxWidth: 920 }}>
      <BillHeaderBand bill={bill} canWrite={canWrite} />
      <div style={{ marginTop: 20 }}>
        <BillChargesPanel bill={bill} items={items} adjustments={adjustments} />
      </div>
    </div>
  );
}
