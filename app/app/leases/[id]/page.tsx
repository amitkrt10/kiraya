import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLease } from "@/lib/queries/leases";
import { getLeaseParties } from "@/lib/queries/leaseParties";
import { getLeaseRentRules } from "@/lib/queries/rentRules";
import { getLeaseBillingConfigs } from "@/lib/queries/billingConfigs";
import { getTenantsForPicker } from "@/lib/queries/tenants";
import { LeaseHeaderBand } from "@/components/leases/LeaseHeaderBand";
import { LeaseDetailTabs } from "@/components/leases/LeaseDetailTabs";
import { Alert } from "@/components/ui/Alert";
import { isUuid } from "@/lib/utils/uuid";

const SETUP_LABELS: Record<string, string> = {
  rentRule: "rent rule",
  billingConfig: "billing configuration",
};

export default async function LeaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ setupIncomplete?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const { setupIncomplete } = await searchParams;

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [lease, parties, rentRules, billingConfigs, tenants, canWrite] = await Promise.all([
    getLease(id, organizationId),
    getLeaseParties(id, organizationId),
    getLeaseRentRules(id, organizationId),
    getLeaseBillingConfigs(id, organizationId),
    getTenantsForPicker(organizationId),
    canWriteOrganization(organizationId),
  ]);

  if (!lease) {
    notFound();
  }

  const incompleteParts = (setupIncomplete ?? "")
    .split(",")
    .filter(Boolean)
    .map((key) => SETUP_LABELS[key] ?? key);

  return (
    <div>
      {incompleteParts.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="warning">
            The lease was created, but its {incompleteParts.join(" and ")} couldn&apos;t be saved. Add it below.
          </Alert>
        </div>
      ) : null}
      <LeaseHeaderBand lease={lease} canWrite={canWrite} />
      <LeaseDetailTabs
        lease={lease}
        parties={parties}
        tenants={tenants}
        rentRules={rentRules}
        billingConfigs={billingConfigs}
        canWrite={canWrite}
      />
    </div>
  );
}
