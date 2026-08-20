"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { reversePaymentAction, type ReversePaymentActionState } from "@/lib/actions/payments";
import type { PaymentDetail } from "@/lib/queries/payments";
import styles from "@/components/ui/FormSection.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: ReversePaymentActionState = {};

export function ReversePaymentDialog({ payment }: { payment: PaymentDetail }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = reversePaymentAction.bind(null, payment.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: `Payment ${payment.payment_number} reversed.`, variant: "success" });
      router.refresh();
    }
  }, [state.success, payment.payment_number, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Undo2 width={16} height={16} aria-hidden="true" />
        Reverse Payment
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={`Reverse Payment ${payment.payment_number}`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Reverse Payment
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
            {payment.tenants?.display_name ?? "This tenant"} · {payment.payment_date}
          </p>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, margin: "10px 0" }}>
            {formatCurrency(payment.amount, payment.currency_code)}
          </div>
          <p style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 14 }}>
            This creates a reversal — the original payment is preserved for audit but its allocations are undone and
            affected bills return to their prior state. This cannot be undone from here.
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
