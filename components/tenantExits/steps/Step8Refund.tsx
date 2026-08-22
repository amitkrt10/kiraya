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
import { CreditRefundStatusTag } from "@/components/tenantExits/CreditRefundStatusTag";
import { createDepositRefundAction, createCreditRefundAction, type TenantExitActionState } from "@/lib/actions/tenantExits";
import type { ExitSettlementRow, DepositRefundRow, TenantCreditRefundRow } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: TenantExitActionState = {};

/**
 * P5.7G: two structurally separate cards, one per money origin. Neither
 * card's amount is ever computed here — remainingDepositRefundable/
 * remainingCreditRefundable are both server-computed (page.tsx),
 * themselves simple subtractions of two already-authoritative numbers,
 * exactly the pattern the deposit action already used pre-P5.7 (never a
 * financial calculation). Final Amount Due gets its own band and is
 * never labeled a refund, and is shown regardless of whether either pool
 * has anything refundable — the two are independent under Model C2.
 */
export function Step8Refund({
  settlement,
  paymentMethods,
  canWrite,
  tenantId,
  // Pool A — tenant credit
  creditRefunds,
  remainingCreditRefundable,
  // Pool B — security deposit
  hasDeposit,
  depositHeld,
  depositRefunds,
  remainingDepositRefundable,
  nextHref,
  backHref,
}: {
  settlement: ExitSettlementRow;
  paymentMethods: { id: string; name: string }[];
  canWrite: boolean;
  tenantId: string;
  creditRefunds: TenantCreditRefundRow[];
  remainingCreditRefundable: number;
  hasDeposit: boolean;
  depositHeld: number;
  depositRefunds: DepositRefundRow[];
  remainingDepositRefundable: number;
  nextHref: string;
  backHref: string;
}) {
  const router = useRouter();
  const { show } = useToast();

  const creditHandled = useRef(false);
  const creditAction = createCreditRefundAction.bind(null, settlement.id, tenantId);
  const [creditState, creditFormAction, creditPending] = useActionState(creditAction, initialState);

  const depositHandled = useRef(false);
  const depositAction = createDepositRefundAction.bind(null, settlement.id, tenantId);
  const [depositState, depositFormAction, depositPending] = useActionState(depositAction, initialState);

  useEffect(() => {
    if (creditState.success && !creditHandled.current) {
      creditHandled.current = true;
      show({ message: "Credit refund recorded.", variant: "success" });
      router.refresh();
    }
  }, [creditState.success, show, router]);

  useEffect(() => {
    if (depositState.success && !depositHandled.current) {
      depositHandled.current = true;
      show({ message: "Deposit refund recorded.", variant: "success" });
      router.refresh();
    }
  }, [depositState.success, show, router]);

  const canRecordCreditRefund = canWrite && remainingCreditRefundable > 0;
  const canRecordDepositRefund = canWrite && hasDeposit && remainingDepositRefundable > 0;

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Refund / Amount Payable</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 24 }}>
        Two separate money sources, two separate actions — shown separately on purpose.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* ---- CARD A: TENANT CREDIT ---- */}
        <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "2px solid var(--color-divider)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Tenant Credit</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>From the tenant&apos;s own ledger balance</div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Applied to exit charges</span>
            <span className="num">{formatCurrency(settlement.credit_applied, settlement.currency_code)}</span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: settlement.credit_origin_refundable > 0 ? "color-mix(in srgb, var(--color-success) 8%, var(--color-bg))" : "var(--color-neutral-100)" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Credit-Origin Refundable</span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: settlement.credit_origin_refundable > 0 ? "var(--color-success)" : "var(--color-neutral-700)" }}>
              {formatCurrency(settlement.credit_origin_refundable, settlement.currency_code)}
            </span>
          </div>

          {creditRefunds.length > 0 ? (
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {creditRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{refund.refund_reference}</td>
                    <td>
                      <CreditRefundStatusTag status={refund.status} />
                    </td>
                    <td className="num">{formatCurrency(refund.amount, refund.currency_code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "14px 20px", fontSize: 12, color: "var(--color-neutral-700)" }}>
              {settlement.credit_origin_refundable > 0 ? "No credit refund recorded yet." : "Nothing to refund from credit."}
            </div>
          )}

          {canRecordCreditRefund ? (
            <Card style={{ padding: 18, margin: 16, marginTop: 0 }}>
              {creditState.error ? (
                <div style={{ marginBottom: 12 }}>
                  <Alert variant="error">{creditState.error}</Alert>
                </div>
              ) : null}
              <form action={creditFormAction}>
                <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Amount</label>
                    <input className="input" value={formatCurrency(remainingCreditRefundable, settlement.currency_code)} disabled />
                    <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 4 }}>Set to Credit-Origin Refundable — cannot exceed it.</div>
                  </div>
                  <Input label="Refund Date" name="refundDate" type="date" error={creditState.fieldErrors?.refundDate?.[0]} />
                  <Select
                    label="Payment Method"
                    name="paymentMethodId"
                    options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }))}
                    placeholder="Select a method"
                    error={creditState.fieldErrors?.paymentMethodId?.[0]}
                  />
                  <Input label="Transaction Reference" name="transactionReference" error={creditState.fieldErrors?.transactionReference?.[0]} />
                </div>
                <Button variant="secondary" type="submit" loading={creditPending}>
                  Refund Tenant Credit
                </Button>
              </form>
            </Card>
          ) : null}
        </div>

        {/* ---- CARD B: SECURITY DEPOSIT ---- */}
        <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "2px solid var(--color-divider)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Security Deposit</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>Held independently of the tenant&apos;s ledger</div>
          </div>
          {hasDeposit ? (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Held</span>
                <span className="num">{formatCurrency(depositHeld, settlement.currency_code)}</span>
              </div>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Applied to exit charges</span>
                <span className="num">{formatCurrency(settlement.deposit_consumed, settlement.currency_code)}</span>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: settlement.deposit_origin_refundable > 0 ? "color-mix(in srgb, var(--color-success) 8%, var(--color-bg))" : "var(--color-neutral-100)" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Deposit-Origin Refundable</span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: settlement.deposit_origin_refundable > 0 ? "var(--color-success)" : "var(--color-neutral-700)" }}>
                  {formatCurrency(settlement.deposit_origin_refundable, settlement.currency_code)}
                </span>
              </div>

              {depositRefunds.length > 0 ? (
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositRefunds.map((refund) => (
                      <tr key={refund.id}>
                        <td>{refund.refund_reference}</td>
                        <td>
                          <DepositRefundStatusTag status={refund.status} />
                        </td>
                        <td className="num">{formatCurrency(refund.amount, refund.currency_code)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "14px 20px", fontSize: 12, color: "var(--color-neutral-700)" }}>
                  {settlement.deposit_origin_refundable > 0 ? "No deposit refund recorded yet." : "Nothing to refund from the deposit."}
                </div>
              )}

              {canRecordDepositRefund ? (
                <Card style={{ padding: 18, margin: 16, marginTop: 0 }}>
                  {depositState.error ? (
                    <div style={{ marginBottom: 12 }}>
                      <Alert variant="error">{depositState.error}</Alert>
                    </div>
                  ) : null}
                  <form action={depositFormAction}>
                    <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Amount</label>
                        <input className="input" value={formatCurrency(remainingDepositRefundable, settlement.currency_code)} disabled />
                        <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 4 }}>Set to Deposit-Origin Refundable — cannot exceed it.</div>
                      </div>
                      <Input label="Refund Date" name="refundDate" type="date" error={depositState.fieldErrors?.refundDate?.[0]} />
                      <Select
                        label="Payment Method"
                        name="paymentMethodId"
                        options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }))}
                        placeholder="Select a method"
                        error={depositState.fieldErrors?.paymentMethodId?.[0]}
                      />
                      <Input label="Transaction Reference" name="transactionReference" error={depositState.fieldErrors?.transactionReference?.[0]} />
                    </div>
                    <Button variant="secondary" type="submit" loading={depositPending}>
                      Refund Security Deposit
                    </Button>
                  </form>
                </Card>
              ) : null}
            </>
          ) : (
            <div style={{ padding: "16px 20px", fontSize: 12, color: "var(--color-neutral-700)" }}>No security deposit is on file for this tenant.</div>
          )}
        </div>
      </div>

      <div
        style={{
          border: "2px solid var(--color-divider)",
          background: settlement.final_amount_due > 0 ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-bg))" : "var(--color-neutral-100)",
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Amount Payable by Tenant</div>
          <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>Not a refund — this is what the tenant still owes after credit and deposit were applied.</div>
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, color: settlement.final_amount_due > 0 ? "var(--color-accent-700)" : "var(--color-text)" }}>
          {formatCurrency(settlement.final_amount_due, settlement.currency_code)}
        </div>
      </div>

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
