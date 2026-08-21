"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createUtilityRateAction, type UtilityRateActionState } from "@/lib/actions/utilityRates";
import styles from "@/components/ui/FormSection.module.css";

const initialState: UtilityRateActionState = {};

export function CreateRateDialog({ utilityId }: { utilityId: string }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = createUtilityRateAction.bind(null, utilityId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Rate added.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Rate
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Rate"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Save Rate
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
          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Rate" name="rate" type="number" step="any" min={0.01} required error={fieldError("rate")} />
            <Input label="Unit" name="unitName" placeholder="e.g. kWh" required error={fieldError("unitName")} />
            <Input label="Effective From" name="effectiveFrom" type="date" required error={fieldError("effectiveFrom")} />
            <Input label="Effective To" name="effectiveTo" type="date" error={fieldError("effectiveTo")} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
