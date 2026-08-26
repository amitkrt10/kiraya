"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createTenantUnitAssignmentAction, type TenantUnitAssignmentActionState } from "@/lib/actions/tenantUnitAssignment";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import { BILLING_FREQUENCIES, PRORATION_METHODS } from "@/lib/validation/billingConfig";
import styles from "@/components/ui/FormSection.module.css";

const FREQUENCY_LABELS: Record<(typeof BILLING_FREQUENCIES)[number], string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

const PRORATION_LABELS: Record<(typeof PRORATION_METHODS)[number], string> = {
  CALENDAR_DAYS: "Calendar days",
  FIXED_30_DAYS: "Fixed 30 days",
  DATE_TO_DATE: "Date to date",
  NONE: "None",
};

const initialState: TenantUnitAssignmentActionState = {};

/**
 * P6.3-C: the whole flow calls one thing — kiraya.
 * create_tenant_unit_assignment() (P6.3-B), via createTenantUnitAssignmentAction
 * -- never four separate inserts from this component. Nothing here shows
 * or asks about "Lease"; the occupancy record it creates internally is
 * never named that in this UI.
 *
 * Effective From/To (rent rule and billing config) and first_bill_prorate/
 * final_bill_prorate/bill_in_advance (billing config — P6.2 audit found
 * them stored but inert) are deliberately not fields here at all.
 */
export function AssignTenantDrawer({ unitId, tenants }: { unitId: string; tenants: TenantPickerItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const [billingFrequency, setBillingFrequency] = useState<string>("MONTHLY");
  const [hasDeposit, setHasDeposit] = useState(false);

  const action = createTenantUnitAssignmentAction.bind(null, unitId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Tenant assigned.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Assign Tenant
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Assign Tenant"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Assign Tenant
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

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Tenant</div>
            <div className={styles.grid}>
              <Select
                label="Tenant"
                name="tenantId"
                required
                placeholder={tenants.length === 0 ? "No active tenants yet — create one first" : "Select a tenant"}
                options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.display_name} (${tenant.tenant_code})` }))}
                error={fieldError("tenantId")}
              />
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <Link href="/app/tenants/new" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                  + Create Tenant
                </Link>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 6 }}>
              Opens in a new tab — come back and reopen this drawer to pick the new tenant once they&apos;re created.
            </p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Occupancy</div>
            <div className={styles.grid}>
              <Input
                label="Occupancy Start Date"
                name="occupancyStartDate"
                type="date"
                required
                error={fieldError("occupancyStartDate")}
              />
              <div className={styles.fullWidth}>
                <label htmlFor="occupancy-notes" style={{ fontSize: 12, fontWeight: 600 }}>
                  Notes
                </label>
                <textarea
                  id="occupancy-notes"
                  name="occupancyNotes"
                  className="input"
                  rows={2}
                  style={{ marginTop: 6, resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Initial Rent</div>
            <div className={styles.grid}>
              <Input label="Rule Name" name="ruleName" required defaultValue="Base Rent" error={fieldError("ruleName")} />
              <Input
                label="Monthly Rent"
                name="monthlyRent"
                type="number"
                step="any"
                min={0}
                required
                error={fieldError("monthlyRent")}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Billing Configuration</div>
            <div className={styles.grid}>
              <Select
                label="Billing Frequency"
                name="billingFrequency"
                required
                options={BILLING_FREQUENCIES.map((value) => ({ value, label: FREQUENCY_LABELS[value] }))}
                value={billingFrequency}
                onChange={(event) => setBillingFrequency(event.target.value)}
                error={fieldError("billingFrequency")}
              />
              <Input
                label="Billing Day"
                name="billingDay"
                type="number"
                min={1}
                max={31}
                required={billingFrequency === "MONTHLY"}
                defaultValue={1}
                hint="Day of month bills are generated"
                error={fieldError("billingDay")}
              />
              <Select
                label="Proration Method"
                name="prorationMethod"
                required
                options={PRORATION_METHODS.map((value) => ({ value, label: PRORATION_LABELS[value] }))}
                defaultValue="CALENDAR_DAYS"
                error={fieldError("prorationMethod")}
              />
              <Input
                label="Due Days After Bill"
                name="dueDaysAfterBill"
                type="number"
                min={0}
                max={365}
                required
                defaultValue={0}
                error={fieldError("dueDaysAfterBill")}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Security Deposit</div>
            <div className={styles.grid}>
              <div className={styles.fullWidth}>
                <Checkbox
                  label="Collect a security deposit for this occupancy"
                  checked={hasDeposit}
                  onChange={(event) => setHasDeposit(event.target.checked)}
                />
              </div>
              {hasDeposit ? (
                <>
                  <Input
                    label="Required Amount"
                    name="depositRequiredAmount"
                    type="number"
                    step="any"
                    min={0}
                    error={fieldError("depositRequiredAmount")}
                  />
                  <Input
                    label="Reference"
                    name="depositReference"
                    hint="Leave blank to generate one automatically"
                    error={fieldError("depositReference")}
                  />
                  <div className={styles.fullWidth}>
                    <label htmlFor="deposit-notes" style={{ fontSize: 12, fontWeight: 600 }}>
                      Notes
                    </label>
                    <textarea
                      id="deposit-notes"
                      name="depositNotes"
                      className="input"
                      rows={2}
                      style={{ marginTop: 6, resize: "vertical" }}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </form>
      </Drawer>
    </>
  );
}
