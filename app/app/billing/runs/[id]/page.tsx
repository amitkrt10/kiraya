import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { getBillingRun, getBillingRunBills, getBillingRunFailures } from "@/lib/queries/billingRuns";
import { BillingRunHeaderBand } from "@/components/billing/BillingRunHeaderBand";
import { BillingRunSummary } from "@/components/billing/BillingRunSummary";
import { BillingRunFailures } from "@/components/billing/BillingRunFailures";
import { BillingRunBillsTable } from "@/components/billing/BillingRunBillsTable";
import { isUuid } from "@/lib/utils/uuid";

export default async function BillingRunDetailPage({
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

  const run = await getBillingRun(id, organizationId);
  if (!run) {
    notFound();
  }

  const [bills, failures] = await Promise.all([getBillingRunBills(id, organizationId), getBillingRunFailures(run)]);

  return (
    <div>
      <BillingRunHeaderBand run={run} />
      <BillingRunSummary run={run} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Generated Bills
          </div>
          <BillingRunBillsTable bills={bills} />
        </div>

        {run.failed_bills > 0 ? (
          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Failures</div>
            <BillingRunFailures failures={failures} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
