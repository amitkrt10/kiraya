"use client";

import { useActionState, useId } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { initiateTenantExitAction, type TenantExitActionState } from "@/lib/actions/tenantExits";
import type { LeaseDetail } from "@/lib/queries/leases";

const initialState: TenantExitActionState = {};

/** initiateTenantExitAction redirect()s straight to the new exit's Review step on success — this component only ever needs to render the form or a returned validation error. */
export function Step1Initiation({ lease }: { lease: LeaseDetail }) {
  const formId = useId();
  const action = initiateTenantExitAction.bind(null, lease.id, lease.tenant_id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Start Tenant Exit</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 28 }}>
        {lease.tenants?.display_name ?? "This tenant"} — {lease.units?.unit_code}
        {lease.units?.properties ? ` · ${lease.units.properties.name}` : ""}. You can review everything before anything is
        finalized.
      </div>

      {state.error ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <form action={formAction}>
        <Card>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            <Input label="Notice Date" name="noticeDate" type="date" error={fieldError("noticeDate")} />
            <Input label="Planned Exit Date" name="plannedExitDate" type="date" error={fieldError("plannedExitDate")} />
            <Input label="Handover Date" name="handoverDate" type="date" error={fieldError("handoverDate")} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor={`${formId}-reason`} style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Reason
              </label>
              <textarea id={`${formId}-reason`} name="reason" className="input" rows={2} style={{ resize: "vertical" }} />
              {fieldError("reason") ? (
                <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--color-accent-700)" }} role="alert">
                  {fieldError("reason")}
                </span>
              ) : null}
            </div>
          </div>
        </Card>

        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", margin: "16px 0 24px" }}>
          An exit reference is generated automatically once you continue.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" type="submit" loading={isPending}>
            Continue to Tenant / Lease Review
          </Button>
        </div>
      </form>
    </>
  );
}
