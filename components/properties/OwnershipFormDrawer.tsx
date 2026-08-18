"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { OwnershipForm } from "./OwnershipForm";
import {
  createOwnershipAction,
  updateOwnershipAction,
  type OwnershipActionState,
} from "@/lib/actions/ownerships";
import type { OwnerRow, PropertyOwnershipItem } from "@/lib/queries/owners";

const initialState: OwnershipActionState = {};

export interface OwnershipFormDrawerProps {
  mode: "create" | "edit";
  propertyId: string;
  owners: OwnerRow[];
  ownership?: PropertyOwnershipItem;
}

export function OwnershipFormDrawer({ mode, propertyId, owners, ownership }: OwnershipFormDrawerProps) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);

  const action =
    mode === "create"
      ? createOwnershipAction.bind(null, propertyId)
      : updateOwnershipAction.bind(null, ownership!.id, propertyId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({
        message: mode === "create" ? "Owner added." : "Ownership record updated.",
        variant: "success",
      });
    }
  }, [state.success, mode, show]);

  return (
    <>
      {mode === "create" ? (
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus width={16} height={16} aria-hidden="true" />
          Add Owner
        </Button>
      ) : (
        <Button variant="icon" aria-label="Edit ownership" onClick={() => setOpen(true)}>
          <Pencil width={14} height={14} aria-hidden="true" />
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={mode === "create" ? "Add Owner" : "Edit Ownership"}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              {mode === "create" ? "Add Owner" : "Save Changes"}
            </Button>
          </>
        }
      >
        <OwnershipForm formId={formId} formAction={formAction} state={state} owners={owners} ownership={ownership} />
      </Drawer>
    </>
  );
}
