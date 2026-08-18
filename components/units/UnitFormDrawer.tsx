"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { UnitForm } from "./UnitForm";
import { createUnitAction, updateUnitAction, type UnitActionState } from "@/lib/actions/units";
import type { UnitDetail } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";

const initialState: UnitActionState = {};

export interface UnitFormDrawerProps {
  mode: "create" | "edit";
  propertyId: string;
  unit?: UnitDetail;
  unitTypes: UnitType[];
}

export function UnitFormDrawer({ mode, propertyId, unit, unitTypes }: UnitFormDrawerProps) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);

  const action =
    mode === "create"
      ? createUnitAction.bind(null, propertyId)
      : updateUnitAction.bind(null, unit!.id, propertyId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: mode === "create" ? "Unit created." : "Unit updated.", variant: "success" });
    }
  }, [state.success, mode, show]);

  return (
    <>
      <Button variant={mode === "create" ? "primary" : "secondary"} onClick={() => setOpen(true)}>
        {mode === "create" ? (
          <Plus width={16} height={16} aria-hidden="true" />
        ) : (
          <Pencil width={16} height={16} aria-hidden="true" />
        )}
        {mode === "create" ? "Add Unit" : "Edit Unit"}
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={mode === "create" ? "Add Unit" : "Edit Unit"}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              {mode === "create" ? "Create Unit" : "Save Changes"}
            </Button>
          </>
        }
      >
        <UnitForm formId={formId} formAction={formAction} state={state} unit={unit} unitTypes={unitTypes} />
      </Drawer>
    </>
  );
}
