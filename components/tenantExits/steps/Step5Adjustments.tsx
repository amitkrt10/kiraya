"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { addSettlementAdjustmentAction, type TenantExitActionState } from "@/lib/actions/tenantExits";
import { SETTLEMENT_ADJUSTMENT_TYPES } from "@/lib/validation/tenantExit";
import type { ExitSettlementItemRow } from "@/lib/queries/tenantExits";
import gridStyles from "@/components/ui/ResponsiveGrid.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const TYPE_OPTIONS = SETTLEMENT_ADJUSTMENT_TYPES.map((type) => ({ value: type, label: type.replaceAll("_", " ") }));

const initialState: TenantExitActionState = {};

export function Step5Adjustments({
  chargeItems,
  historicalCreditItems,
  currencyCode,
  exitSettlementId,
  tenantId,
  canWrite,
  canEdit,
  nextHref,
  backHref,
}: {
  chargeItems: ExitSettlementItemRow[];
  historicalCreditItems: ExitSettlementItemRow[];
  currencyCode: string;
  exitSettlementId: string;
  tenantId: string;
  canWrite: boolean;
  canEdit: boolean;
  nextHref: string;
  backHref: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const handledSuccess = useRef(false);
  const action = addSettlementAdjustmentAction.bind(null, exitSettlementId, tenantId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      show({ message: "Charge added.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Adjustments</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 24 }}>
        Final charges for this exit — cleaning, damage, or other one-off amounts. Charges only: this step cannot create or edit
        credit-type adjustments.
      </div>

      {chargeItems.length > 0 || historicalCreditItems.length > 0 ? (
        <table className="table" style={{ marginBottom: 8 }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {chargeItems.map((item) => (
              <tr key={item.id}>
                <td>{item.item_type.replaceAll("_", " ")}</td>
                <td>{item.description}</td>
                <td className="num">{formatCurrency(item.amount, currencyCode)}</td>
              </tr>
            ))}
            {historicalCreditItems.map((item) => (
              <tr key={item.id} style={{ color: "var(--color-neutral-700)" }}>
                <td>
                  {item.item_type.replaceAll("_", " ")} <span className="tag tag-outline" style={{ marginLeft: 6 }}>Historical</span>
                </td>
                <td>{item.description}</td>
                <td className="num">{formatCurrency(item.amount, currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {historicalCreditItems.length > 0 ? (
        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 16 }}>
          Credit-type entries above are shown for record only — this step cannot create, edit, or apply them, and they do not
          reduce the settlement.
        </div>
      ) : null}

      {canWrite && canEdit ? (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 14 }}>
            Add Charge
          </div>
          {state.error ? (
            <div style={{ marginBottom: 14 }}>
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}
          <form action={formAction} className={gridStyles.formRow} style={{ display: "grid", gap: 14, alignItems: "end" }}>
            <Select label="Type" name="itemType" options={TYPE_OPTIONS} required error={fieldError("itemType")} />
            <Input label="Description" name="description" required error={fieldError("description")} />
            <Input label="Amount" name="amount" type="number" step="any" min={0.01} required error={fieldError("amount")} />
            <Button variant="secondary" type="submit" loading={isPending}>
              Add
            </Button>
          </form>
        </Card>
      ) : null}

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
        Deposit receipts and deductions are recorded on the tenant&apos;s Deposit tab, not here — see Deposit Review for that
        history.
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={nextHref} className="btn btn-primary">
          Continue to Settlement
        </Link>
        <Link href={backHref} className="btn btn-secondary">
          Back
        </Link>
      </div>
    </>
  );
}
