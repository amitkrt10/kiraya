"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { recordDepositReceiptAction, type SecurityDepositActionState } from "@/lib/actions/securityDeposits";
import type { SecurityDepositRow } from "@/lib/queries/securityDeposits";
import styles from "@/components/ui/FormSection.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const initialState: SecurityDepositActionState = {};

/**
 * deposit is null the first time a receipt is recorded for this
 * tenant — kiraya.security_deposits has no dedicated creation RPC
 * (confirmed in P5.4A), so this dialog also collects the two real,
 * required NOT NULL columns that row needs (required_amount,
 * deposit_reference) in that case only; every other field is the
 * same ordinary receipt transaction fields either way.
 */
export function RecordDepositReceiptDialog({
  deposit,
  tenantId,
  leaseId,
  triggerLabel,
}: {
  deposit: SecurityDepositRow | null;
  tenantId: string;
  leaseId: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = recordDepositReceiptAction.bind(null, deposit?.id ?? null, tenantId, leaseId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Deposit receipt recorded.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        {triggerLabel ?? "Record Receipt"}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Record Deposit Receipt"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Record Receipt
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

          {deposit ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)" }}>Required</div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
                  {formatCurrency(deposit.required_amount, deposit.currency_code)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)" }}>Received So Far</div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
                  {formatCurrency(deposit.received_amount, deposit.currency_code)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 14 }}>
              <Input label="Deposit Reference" name="depositReference" required error={fieldError("depositReference")} />
              <Input label="Required Amount" name="requiredAmount" type="number" step="any" min={0} required error={fieldError("requiredAmount")} />
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Amount" name="amount" type="number" step="any" min={0.01} required error={fieldError("amount")} />
            <Input label="Received Date" name="transactionDate" type="date" required error={fieldError("transactionDate")} />
            <Input label="Reference" name="referenceCode" error={fieldError("referenceCode")} />
            <Input label="Description" name="description" required error={fieldError("description")} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
