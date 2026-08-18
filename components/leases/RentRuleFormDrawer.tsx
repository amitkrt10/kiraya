"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createRentRuleAction, type RentRuleActionState } from "@/lib/actions/rentRules";
import styles from "@/components/ui/FormSection.module.css";

const initialState: RentRuleActionState = {};

export function RentRuleFormDrawer({ leaseId }: { leaseId: string }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const action = createRentRuleAction.bind(null, leaseId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Rent rule added.", variant: "success" });
    }
  }, [state.success, show]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Rent Rule
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Rent Rule"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Add Rent Rule
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
            <Input
              label="Rule Name"
              name="ruleName"
              required
              defaultValue="Base Rent"
              error={fieldError("ruleName")}
            />
            <Input
              label="Monthly Rent"
              name="monthlyRent"
              type="number"
              step="any"
              min={0}
              required
              error={fieldError("monthlyRent")}
            />
            <Input
              label="Effective From"
              name="effectiveFrom"
              type="date"
              required
              error={fieldError("effectiveFrom")}
            />
            <Input label="Effective To" name="effectiveTo" type="date" error={fieldError("effectiveTo")} />
            <div className={styles.fullWidth}>
              <label htmlFor={`${formId}-notes`} style={{ fontSize: 12, fontWeight: 600 }}>
                Notes
              </label>
              <textarea
                id={`${formId}-notes`}
                name="notes"
                className="input"
                rows={2}
                style={{ marginTop: 6, resize: "vertical" }}
              />
            </div>
          </div>
        </form>
      </Drawer>
    </>
  );
}
