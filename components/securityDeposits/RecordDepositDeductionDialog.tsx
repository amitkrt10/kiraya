"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { recordDepositDeductionAction, type SecurityDepositActionState } from "@/lib/actions/securityDeposits";
import type { SecurityDepositRow } from "@/lib/queries/securityDeposits";
import styles from "@/components/ui/FormSection.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: SecurityDepositActionState = {};

export function RecordDepositDeductionDialog({
  deposit,
  held,
  tenantId,
  leaseId,
}: {
  deposit: SecurityDepositRow;
  held: number;
  tenantId: string;
  leaseId: string;
}) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = recordDepositDeductionAction.bind(null, deposit.id, tenantId, leaseId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Deposit deduction recorded.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Minus width={16} height={16} aria-hidden="true" />
        Record Deduction
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Record Deposit Deduction"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Record Deduction
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

          <div style={{ borderLeft: "2px solid var(--color-neutral-700)", background: "var(--color-neutral-100)", padding: "10px 14px", fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 14 }}>
            Currently held: <strong style={{ color: "var(--color-text)" }}>{formatCurrency(held, deposit.currency_code)}</strong> — a deduction cannot exceed this amount.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Amount" name="amount" type="number" step="any" min={0.01} max={held > 0 ? held : undefined} required error={fieldError("amount")} />
            <Input label="Deduction Date" name="transactionDate" type="date" required error={fieldError("transactionDate")} />
            <div>
              <label htmlFor={`${formId}-description`} style={{ fontSize: 12, fontWeight: 600 }}>
                Reason <span style={{ color: "var(--color-accent-700)" }}>*</span>
              </label>
              <textarea
                id={`${formId}-description`}
                name="description"
                className="input"
                rows={2}
                required
                style={{ marginTop: 6, resize: "vertical" }}
                aria-invalid={Boolean(fieldError("description")) || undefined}
              />
              {fieldError("description") ? (
                <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--color-accent-700)" }} role="alert">
                  {fieldError("description")}
                </span>
              ) : null}
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
