"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createPaymentMethodAction, type PaymentMethodActionState } from "@/lib/actions/paymentMethods";
import { PAYMENT_METHOD_TYPES } from "@/lib/validation/paymentMethod";
import styles from "@/components/ui/FormSection.module.css";

const TYPE_LABELS: Record<(typeof PAYMENT_METHOD_TYPES)[number], string> = {
  CASH: "Cash",
  ONLINE: "Online",
  DISCOUNT: "Discount",
  OTHER: "Other",
};

const initialState: PaymentMethodActionState = {};

export function PaymentMethodFormDrawer() {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const [state, formAction, isPending] = useActionState(createPaymentMethodAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Payment method added.", variant: "success" });
    }
  }, [state.success, show]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Payment Method
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Payment Method"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Add Payment Method
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
            <Input label="Code" name="code" required error={fieldError("code")} hint="Short internal identifier, e.g. CASH" />
            <Input label="Name" name="name" required error={fieldError("name")} hint="Shown when recording a payment" />
            <Select
              label="Type"
              name="methodType"
              required
              options={PAYMENT_METHOD_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }))}
              defaultValue="CASH"
              error={fieldError("methodType")}
            />
          </div>
        </form>
      </Drawer>
    </>
  );
}
