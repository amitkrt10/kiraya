"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createPaymentAction, type PaymentActionState } from "@/lib/actions/payments";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import type { PaymentMethodPickerItem } from "@/lib/queries/paymentMethods";
import styles from "@/components/ui/FormSection.module.css";

const initialState: PaymentActionState = {};

export function PaymentForm({
  tenants,
  methods,
  preselectedTenantId,
}: {
  tenants: TenantPickerItem[];
  methods: PaymentMethodPickerItem[];
  preselectedTenantId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createPaymentAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Payment</div>
        <div className={styles.grid}>
          <Select
            label="Tenant"
            name="tenantId"
            required
            placeholder={tenants.length === 0 ? "No tenants yet — create one first" : "Select a tenant"}
            options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.display_name} (${tenant.tenant_code})` }))}
            defaultValue={preselectedTenantId}
            error={fieldError("tenantId")}
          />
          <Select
            label="Payment Method"
            name="paymentMethodId"
            required
            placeholder={methods.length === 0 ? "No payment methods yet — add one first" : "Select a method"}
            options={methods.map((method) => ({ value: method.id, label: method.name }))}
            error={fieldError("paymentMethodId")}
          />
          <Input label="Payment Date" name="paymentDate" type="date" required error={fieldError("paymentDate")} />
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="any"
            min={0.01}
            required
            error={fieldError("amount")}
          />
          <Input label="Reference Number" name="referenceNumber" error={fieldError("referenceNumber")} />
          <Input label="Bank Name" name="bankName" error={fieldError("bankName")} />
          <Input label="Cheque Number" name="chequeNumber" error={fieldError("chequeNumber")} />
          <Input label="Transaction Reference" name="transactionReference" error={fieldError("transactionReference")} />
          <div className={styles.fullWidth}>
            <label htmlFor="payment-notes" style={{ fontSize: 12, fontWeight: 600 }}>
              Notes
            </label>
            <textarea id="payment-notes" name="notes" className="input" rows={2} style={{ marginTop: 6, resize: "vertical" }} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>
          This payment is automatically applied to this tenant&apos;s eligible outstanding bills, oldest first. Any amount
          left over after covering all eligible bills becomes available credit — there is no manual bill selection.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Link href="/app/payments">
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" loading={isPending}>
          Record Payment
        </Button>
      </div>
    </form>
  );
}
