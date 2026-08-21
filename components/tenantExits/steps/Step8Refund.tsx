"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { DepositRefundStatusTag } from "@/components/tenantExits/DepositRefundStatusTag";
import { createDepositRefundAction, type TenantExitActionState } from "@/lib/actions/tenantExits";
import type { ExitSettlementRow, DepositRefundRow } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: TenantExitActionState = {};

export function Step8Refund({
  settlement,
  depositHeld,
  hasDeposit,
  existingRefunds,
  remainingRefundable,
  paymentMethods,
  canWrite,
  tenantId,
  nextHref,
  backHref,
}: {
  settlement: ExitSettlementRow;
  depositHeld: number;
  hasDeposit: boolean;
  existingRefunds: DepositRefundRow[];
  remainingRefundable: number;
  paymentMethods: { id: string; name: string }[];
  canWrite: boolean;
  tenantId: string;
  nextHref: string;
  backHref: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const handledSuccess = useRef(false);
  const action = createDepositRefundAction.bind(null, settlement.id, tenantId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      show({ message: "Refund recorded.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  const canRecordRefund = canWrite && hasDeposit && remainingRefundable > 0;

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Refund / Amount Payable</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 20 }}>Two separate records, shown separately on purpose.</div>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          marginBottom: 24,
        }}
      >
        Refund processing uses the finalized settlement amount. The security deposit balance is maintained separately.
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 10 }}>
        Settlement Result
      </div>
      <div className="card" style={{ padding: 0, marginBottom: 28 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>Outstanding Dues</span>
          <span className="num">{formatCurrency(settlement.previous_dues, settlement.currency_code)}</span>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>Settlement Charges</span>
          <span className="num">{formatCurrency(settlement.final_charges, settlement.currency_code)}</span>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "2px solid var(--color-divider)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>Final Amount Due</span>
          <span className="num" style={{ fontWeight: 600 }}>
            {formatCurrency(settlement.final_amount_due, settlement.currency_code)}
          </span>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "color-mix(in srgb, var(--color-success) 8%, var(--color-bg))" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Final Amount Refundable</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>The authoritative refund amount from the finalized settlement.</div>
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, color: "var(--color-success)" }}>
            {formatCurrency(settlement.final_amount_refundable, settlement.currency_code)}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 10 }}>
        Security Deposit Status
      </div>
      {hasDeposit ? (
        <>
          <div className="card" style={{ padding: "18px 20px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>Security Deposit Held</div>
              <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>From the deposit&apos;s own transaction history — see Deposit Review.</div>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26 }}>{formatCurrency(depositHeld, settlement.currency_code)}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 28 }}>
            This balance is not automatically applied to the settlement above. Held and Final Amount Refundable are independent
            figures unless deposit deductions were recorded against the exit charges.
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 28 }}>No security deposit is on file for this tenant.</div>
      )}

      {existingRefunds.length > 0 ? (
        <table className="table" style={{ marginBottom: 20 }}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {existingRefunds.map((refund) => (
              <tr key={refund.id}>
                <td>{refund.refund_reference}</td>
                <td style={{ color: "var(--color-neutral-700)" }}>{refund.refund_date ?? "—"}</td>
                <td>
                  <DepositRefundStatusTag status={refund.status} />
                </td>
                <td className="num">{formatCurrency(refund.amount, refund.currency_code)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {canRecordRefund ? (
        <Card style={{ padding: 22, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 16 }}>Record Refund</div>
          {state.error ? (
            <div style={{ marginBottom: 14 }}>
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}
          <form action={formAction}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Amount</label>
                <input className="input" value={formatCurrency(remainingRefundable, settlement.currency_code)} disabled />
                <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 4 }}>Set to Final Amount Refundable — cannot exceed it.</div>
              </div>
              <Input label="Refund Date" name="refundDate" type="date" error={fieldError("refundDate")} />
              <Select
                label="Payment Method"
                name="paymentMethodId"
                options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }))}
                placeholder="Select a method"
                error={fieldError("paymentMethodId")}
              />
              <Input label="Transaction Reference" name="transactionReference" error={fieldError("transactionReference")} />
            </div>
            <Button variant="secondary" type="submit" loading={isPending}>
              Record Refund
            </Button>
          </form>
        </Card>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={nextHref} className="btn btn-primary">
          Continue to Completion
        </Link>
        <Link href={backHref} className="btn btn-secondary">
          Back
        </Link>
      </div>
    </>
  );
}
