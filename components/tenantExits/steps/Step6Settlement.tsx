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

/**
 * P5.7F/G: every figure here is read straight off the settlement row —
 * credit_applied/deposit_consumed (never the superseded tenant_credit/
 * deposit_deduction columns) and the two origin-tagged refundable
 * figures. Final Amount Due is always shown; it is no longer mutually
 * exclusive with the refundable figures — under Model C2 a tenant can
 * simultaneously owe money (previous_dues) and have a fully untouched
 * deposit sitting refundable.
 */
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
        Computed by the backend from outstanding dues, adjustments, available credit, and the security deposit —
        nothing calculated in this screen.
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
          <span>Exit Charges</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {formatCurrency(settlement.final_charges, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between" }}>
          <span>Credit Applied<div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>Against exit charges only — never against Outstanding Dues</div></span>
          <span className="num" style={{ fontWeight: 600, color: settlement.credit_applied > 0 ? "var(--color-success)" : undefined }}>
            {settlement.credit_applied > 0 ? "−" : ""}
            {formatCurrency(settlement.credit_applied, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 24px", borderBottom: "2px solid var(--color-divider)", display: "flex", justifyContent: "space-between" }}>
          <span>Deposit Applied<div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>Covers what credit didn&apos;t — same rule, never touches Outstanding Dues</div></span>
          <span className="num" style={{ fontWeight: 600, color: settlement.deposit_consumed > 0 ? "var(--color-success)" : undefined }}>
            {settlement.deposit_consumed > 0 ? "−" : ""}
            {formatCurrency(settlement.deposit_consumed, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-neutral-100)" }}>
          <span style={{ fontWeight: 700 }}>Final Amount Due</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 24 }}>
            {formatCurrency(settlement.final_amount_due, settlement.currency_code)}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginBottom: 4 }}>Credit-Origin Refundable</div>
          <div className="num" style={{ fontWeight: 700, fontSize: 17 }}>{formatCurrency(settlement.credit_origin_refundable, settlement.currency_code)}</div>
        </div>
        <div className="card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginBottom: 4 }}>Deposit-Origin Refundable</div>
          <div className="num" style={{ fontWeight: 700, fontSize: 17 }}>{formatCurrency(settlement.deposit_origin_refundable, settlement.currency_code)}</div>
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
        Credit and deposit are separate money sources, each refunded independently on the Refund step. A tenant can
        owe money above and still have a refundable deposit or credit balance at the same time.
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
