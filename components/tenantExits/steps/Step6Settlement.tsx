"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { finalizeExitSettlementAction } from "@/lib/actions/tenantExits";
import type { ExitSettlementRow } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function Step6Settlement({
  settlement,
  canWrite,
  canFinalize,
  tenantId,
  nextHref,
  backHref,
}: {
  settlement: ExitSettlementRow;
  canWrite: boolean;
  canFinalize: boolean;
  tenantId: string;
  nextHref: string;
  backHref: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const isRefund = settlement.final_amount_refundable > 0;
  const direction = isRefund ? "Refund Due to Tenant" : settlement.final_amount_due > 0 ? "Amount Payable by Tenant" : "Settled — No Balance";
  const directionAmount = isRefund ? settlement.final_amount_refundable : settlement.final_amount_due;
  const directionColor = isRefund ? "var(--color-success)" : settlement.final_amount_due > 0 ? "var(--color-accent-700)" : "var(--color-text)";

  async function handleFinalize() {
    setIsPending(true);
    setError(undefined);
    const result = await finalizeExitSettlementAction(settlement.id, tenantId);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    show({ message: "Settlement finalized.", variant: "success" });
    router.refresh();
  }

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Settlement</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 24 }}>
        Computed by the backend from outstanding dues, adjustments, and available credit — nothing calculated in this screen.
      </div>

      {error ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between" }}>
          <span>Outstanding Dues</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {formatCurrency(settlement.previous_dues, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between" }}>
          <span>Adjustments (charges)</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {formatCurrency(settlement.final_charges, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between" }}>
          <span>Deposit Deduction</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {formatCurrency(settlement.deposit_deduction, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 24px", borderBottom: "2px solid var(--color-divider)", display: "flex", justifyContent: "space-between" }}>
          <span>Available Credit Applied</span>
          <span className="num" style={{ fontWeight: 600, color: settlement.tenant_credit > 0 ? "var(--color-success)" : undefined }}>
            {settlement.tenant_credit > 0 ? "−" : ""}
            {formatCurrency(settlement.tenant_credit, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-neutral-100)" }}>
          <span style={{ fontWeight: 700 }}>{direction}</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 24, color: directionColor }}>
            {formatCurrency(directionAmount, settlement.currency_code)}
          </span>
        </div>
      </div>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          marginBottom: 24,
        }}
      >
        This does not include the security deposit held — deposit refund is handled separately, on the Refund step.
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {canFinalize ? (
          canWrite ? (
            <Button variant="primary" onClick={handleFinalize} loading={isPending}>
              Finalize Settlement
            </Button>
          ) : null
        ) : (
          <Link href={nextHref} className="btn btn-primary">
            Continue to Final Statement
          </Link>
        )}
        <Link href={backHref} className="btn btn-secondary">
          Back to Adjustments
        </Link>
      </div>
    </>
  );
}
