"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { applyCreditAction, type ApplyCreditActionState } from "@/lib/actions/credit";
import type { BillDetail } from "@/lib/queries/bills";
import styles from "@/components/ui/FormSection.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: ApplyCreditActionState = {};

/**
 * Only ever rendered for a FINALIZED/PARTIALLY_PAID bill with available
 * credit > 0 (see BillPaymentSummary.tsx) — mirrors the eligibility
 * kiraya.apply_tenant_credit_to_bill() itself enforces. The "Maximum
 * Applicable" figure shown here is display/input-validation only; the
 * database independently re-derives and clamps the amount actually
 * applied, and the success toast/refetched tiles always reflect what the
 * backend actually did, never a value assumed client-side.
 */
export function ApplyCreditDialog({
  bill,
  outstanding,
  availableCredit,
}: {
  bill: BillDetail;
  outstanding: number;
  availableCredit: number;
}) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = applyCreditAction.bind(null, bill.id, bill.tenant_id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const maxApplicable = Math.min(availableCredit, outstanding);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Credit applied to bill.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Wallet width={16} height={16} aria-hidden="true" />
        Apply Credit
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={`Apply Credit — Bill ${bill.bill_number}`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Apply Credit
            </Button>
          </>
        }
      >
        <form id={formId} action={formAction}>
          {state.error ? (
            <div className={styles.errorSpacer}>
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
            {bill.tenants?.display_name ?? "This tenant"} · {bill.period_start} – {bill.period_end}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, margin: "14px 0" }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)" }}>
                Available Credit
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>
                {formatCurrency(availableCredit, bill.currency_code)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)" }}>
                Bill Outstanding
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>
                {formatCurrency(outstanding, bill.currency_code)}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 10 }}>
            Maximum applicable: {formatCurrency(maxApplicable, bill.currency_code)}
          </p>

          <Input
            label="Amount"
            name="amount"
            type="number"
            step="any"
            min={0.01}
            max={maxApplicable > 0 ? maxApplicable : undefined}
            required
            error={fieldError("amount")}
          />

          <p style={{ fontSize: 12, color: "var(--color-neutral-700)", marginTop: 10 }}>
            This creates a CREDIT_APPLICATION ledger entry and reduces available credit. The amount actually applied is
            confirmed by the database and may be lower than requested if credit or the bill balance changed.
          </p>
        </form>
      </Dialog>
    </>
  );
}
