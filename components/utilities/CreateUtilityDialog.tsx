"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createUtilityAction, type UtilityActionState } from "@/lib/actions/utilities";
import styles from "@/components/ui/FormSection.module.css";

const initialState: UtilityActionState = {};

export function CreateUtilityDialog() {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createUtilityAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Utility added.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Utility
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Utility"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Add Utility
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
            <Input label="Code" name="code" required error={fieldError("code")} />
            <Input label="Name" name="name" required error={fieldError("name")} />
            <Input label="Description" name="description" error={fieldError("description")} />
            <Input label="Unit Name" name="unitName" placeholder="e.g. kWh, month" error={fieldError("unitName")} />
            <Checkbox label="Metered (readings apply)" name="isMetered" />
          </div>
        </form>
      </Dialog>
    </>
  );
}
