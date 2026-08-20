"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { generateBillingRunAction, previewBillingScopeAction, type BillingRunActionState } from "@/lib/actions/billingRuns";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import styles from "@/components/ui/FormSection.module.css";

const initialState: BillingRunActionState = {};

export function GenerateBillingRunForm({ properties }: { properties: PropertyPickerItem[] }) {
  const [state, formAction, isPending] = useActionState(generateBillingRunAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [preview, setPreview] = useState<{ count?: number; error?: string } | null>(null);
  const [isPreviewing, startPreviewTransition] = useTransition();

  function handlePreview() {
    startPreviewTransition(async () => {
      const result = await previewBillingScopeAction(periodStart, periodEnd, propertyId || undefined);
      setPreview(result);
    });
  }

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Period &amp; Scope</div>
        <div className={styles.grid}>
          <Input
            label="Period Start"
            name="periodStart"
            type="date"
            required
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            error={fieldError("periodStart")}
          />
          <Input
            label="Period End"
            name="periodEnd"
            type="date"
            required
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            error={fieldError("periodEnd")}
          />
          <Input label="Bill Date" name="billDate" type="date" required error={fieldError("billDate")} />
          <Input label="Due Date" name="dueDate" type="date" error={fieldError("dueDate")} hint="Leave blank if not applicable" />
          <Select
            label="Property"
            name="propertyId"
            placeholder="All properties (organization-wide)"
            options={properties.map((property) => ({ value: property.id, label: property.name }))}
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            error={fieldError("propertyId")}
            hint="Leave blank to bill every active lease in the organization"
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Review</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            loading={isPreviewing}
            disabled={!periodStart || !periodEnd}
          >
            Preview Scope
          </Button>
          {preview?.error ? <span style={{ fontSize: 13, color: "var(--color-accent-700)" }}>{preview.error}</span> : null}
          {preview?.count !== undefined ? (
            <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
              Estimated — <strong>{preview.count}</strong> active {preview.count === 1 ? "lease" : "leases"} will be attempted.
              Leases without an active billing configuration, or already billed for this period, will be skipped and listed as
              failures on the run.
            </span>
          ) : (
            <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
              Preview the scope before running — this is an estimate; the actual run re-evaluates scope when it executes.
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Link href="/app/billing">
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" loading={isPending}>
          Run Billing
        </Button>
      </div>
    </form>
  );
}
