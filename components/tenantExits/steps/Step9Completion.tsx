"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { ExitSettlementStatusTag } from "@/components/tenantExits/ExitSettlementStatusTag";
import { TenantExitStatusTag } from "@/components/tenantExits/TenantExitStatusTag";
import { completeTenantExitAction } from "@/lib/actions/tenantExits";
import type { TenantExitRow, ExitSettlementRow, DepositRefundRow } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function Step9Completion({
  exit,
  settlement,
  completedRefunds,
  tenantName,
  unitLabel,
  leaseCode,
  canWrite,
  canComplete,
}: {
  exit: TenantExitRow;
  settlement: ExitSettlementRow;
  completedRefunds: DepositRefundRow[];
  tenantName: string;
  unitLabel: string;
  leaseCode: string;
  canWrite: boolean;
  canComplete: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const totalRefunded = completedRefunds.reduce((sum, refund) => sum + refund.amount, 0);
  const isCompleted = exit.status === "COMPLETED";

  async function handleComplete() {
    setIsPending(true);
    setError(undefined);
    const result = await completeTenantExitAction(exit.id, exit.tenant_id);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    show({ message: "Tenant exit completed.", variant: "success" });
    router.refresh();
  }

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Completion</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 28 }}>
        {isCompleted ? "This exit is complete." : "Last step — confirms exactly what has been done so far, and what completing the exit will do."}
      </div>

      {error ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 10 }}>
        Completed so far
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
          <span style={{ color: "var(--color-neutral-700)" }}>Exit Settlement</span>
          <ExitSettlementStatusTag status={settlement.status} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
          <span style={{ color: "var(--color-neutral-700)" }}>Refund</span>
          <span style={{ fontWeight: 600 }}>
            {completedRefunds.length > 0 ? `${formatCurrency(totalRefunded, settlement.currency_code)} recorded` : "None recorded"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <span style={{ color: "var(--color-neutral-700)" }}>Tenant Exit</span>
          <TenantExitStatusTag status={exit.status} />
        </div>
      </div>

      {isCompleted ? null : canWrite && canComplete ? (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Complete Tenant Exit
        </Button>
      ) : null}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Complete Tenant Exit — ${tenantName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleComplete} loading={isPending}>
              Complete Exit
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 20 }}>
          {unitLabel} · Lease {leaseCode}
        </p>
        <div style={{ borderTop: "1px solid var(--color-neutral-300)", borderBottom: "1px solid var(--color-neutral-300)", padding: "16px 0", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 8 }}>This will:</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
            <li>Mark this tenant exit Completed</li>
            <li>End the lease{exit.actual_exit_date ? `, effective ${exit.actual_exit_date}` : ""}</li>
            <li>
              Set the unit to Vacant —{" "}
              <span style={{ color: "var(--color-neutral-700)" }}>
                unless another active or draft lease already reserves it, in which case the unit&apos;s status is left unchanged
              </span>
            </li>
          </ul>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
          This finalizes the exit. It cannot be undone. No further accounting action is taken beyond what&apos;s listed above —
          the settlement and any refund were already recorded in the previous steps.
        </p>
      </Dialog>
    </>
  );
}
