import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLease } from "@/lib/queries/leases";
import { LeaseEditForm } from "@/components/leases/LeaseEditForm";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { isUuid } from "@/lib/utils/uuid";

export default async function EditLeasePage({
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

  const [lease, canWrite] = await Promise.all([
    getLease(id, organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!lease) {
    notFound();
  }

  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to edit leases in this organization." />;
  }

  return (
    <Card>
      <LeaseEditForm lease={lease} />
    </Card>
  );
}
