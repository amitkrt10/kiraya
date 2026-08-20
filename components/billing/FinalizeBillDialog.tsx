"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { finalizeBillAction } from "@/lib/actions/bills";
import type { BillDetail } from "@/lib/queries/bills";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function FinalizeBillDialog({ bill }: { bill: BillDetail }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { show } = useToast();
  const handledSuccess = useRef(false);
  const router = useRouter();

  async function handleConfirm() {
    setIsPending(true);
    setError(undefined);
    const result = await finalizeBillAction(bill.id);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    handledSuccess.current = true;
    setOpen(false);
    show({ message: `Bill ${bill.bill_number} finalized.`, variant: "success" });
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Check width={16} height={16} aria-hidden="true" />
        Finalize Bill
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Finalize Bill ${bill.bill_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm} loading={isPending}>
              Finalize Bill
            </Button>
          </>
        }
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
          {bill.tenants?.display_name ?? "This tenant"} · {bill.period_start} – {bill.period_end}
        </p>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, margin: "10px 0" }}>
          {formatCurrency(bill.total_amount, bill.currency_code)}
        </div>
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
          This locks the bill&apos;s charges from further edits and posts it to the ledger. This does not send anything to the
          tenant automatically.
        </p>
      </Dialog>
    </>
  );
}
