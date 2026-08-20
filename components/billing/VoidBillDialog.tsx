"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { voidBillAction, type BillActionState } from "@/lib/actions/bills";
import type { BillDetail } from "@/lib/queries/bills";
import styles from "@/components/ui/FormSection.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: BillActionState = {};

/**
 * Only ever rendered by BillHeaderBand for a FINALIZED bill — voiding a
 * DRAFT bill hits a tracked backend defect (bills_finalization_check),
 * so the documented DRAFT -> FINALIZED -> VOID flow is enforced here by
 * simply never offering Void before finalization.
 */
export function VoidBillDialog({ bill }: { bill: BillDetail }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = voidBillAction.bind(null, bill.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: `Bill ${bill.bill_number} voided.`, variant: "success" });
      router.refresh();
    }
  }, [state.success, bill.bill_number, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Ban width={16} height={16} aria-hidden="true" />
        Void Bill
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={`Void Bill ${bill.bill_number}`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Void Bill
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
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, margin: "10px 0" }}>
            {formatCurrency(bill.total_amount, bill.currency_code)}
          </div>
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 14 }}>
            This creates a reversal — the original bill is preserved for audit but excluded from all totals and reports once
            voided. This cannot be undone from here.
          </p>
          <div>
            <label htmlFor={`${formId}-reason`} style={{ fontSize: 12, fontWeight: 600 }}>
              Reason <span style={{ color: "var(--color-accent-700)" }}>*</span>
            </label>
            <textarea
              id={`${formId}-reason`}
              name="reason"
              className="input"
              rows={3}
              required
              style={{ marginTop: 6, resize: "vertical" }}
              aria-invalid={Boolean(fieldError("reason")) || undefined}
            />
            {fieldError("reason") ? (
              <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--color-accent-700)" }} role="alert">
                {fieldError("reason")}
              </span>
            ) : null}
          </div>
        </form>
      </Dialog>
    </>
  );
}
