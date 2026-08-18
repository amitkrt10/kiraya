"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createBillingConfigAction, type BillingConfigActionState } from "@/lib/actions/billingConfigs";
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

const initialState: BillingConfigActionState = {};

export function BillingConfigFormDrawer({ leaseId }: { leaseId: string }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const [billingFrequency, setBillingFrequency] = useState("MONTHLY");
  const action = createBillingConfigAction.bind(null, leaseId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Billing configuration added.", variant: "success" });
    }
  }, [state.success, show]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Billing Configuration
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Billing Configuration"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Add Configuration
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
            <Input
              label="Effective From"
              name="effectiveFrom"
              type="date"
              required
              error={fieldError("effectiveFrom")}
            />
            <Input label="Effective To" name="effectiveTo" type="date" error={fieldError("effectiveTo")} />
            <div className={styles.fullWidth} style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <Checkbox label="Prorate first bill" name="firstBillProrate" defaultChecked />
              <Checkbox label="Prorate final bill" name="finalBillProrate" defaultChecked />
              <Checkbox label="Bill in advance" name="billInAdvance" />
            </div>
          </div>
        </form>
      </Drawer>
    </>
  );
}
