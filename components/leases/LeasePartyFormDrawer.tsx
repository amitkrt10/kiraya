"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { LeasePartyForm } from "./LeasePartyForm";
import {
  createLeasePartyAction,
  updateLeasePartyAction,
  type LeasePartyActionState,
} from "@/lib/actions/leaseParties";
import type { LeasePartyItem } from "@/lib/queries/leaseParties";
import type { TenantPickerItem } from "@/lib/queries/tenants";

const initialState: LeasePartyActionState = {};

export interface LeasePartyFormDrawerProps {
  mode: "create" | "edit";
  leaseId: string;
  tenants: TenantPickerItem[];
  party?: LeasePartyItem;
}

export function LeasePartyFormDrawer({ mode, leaseId, tenants, party }: LeasePartyFormDrawerProps) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);

  const action =
    mode === "create"
      ? createLeasePartyAction.bind(null, leaseId)
      : updateLeasePartyAction.bind(null, party!.id, leaseId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: mode === "create" ? "Party added." : "Party updated.", variant: "success" });
    }
  }, [state.success, mode, show]);

  return (
    <>
      {mode === "create" ? (
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus width={16} height={16} aria-hidden="true" />
          Add Party
        </Button>
      ) : (
        <Button variant="icon" aria-label="Edit party" onClick={() => setOpen(true)}>
          <Pencil width={14} height={14} aria-hidden="true" />
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={mode === "create" ? "Add Party" : "Edit Party"}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              {mode === "create" ? "Add Party" : "Save Changes"}
            </Button>
          </>
        }
      >
        <LeasePartyForm formId={formId} formAction={formAction} state={state} tenants={tenants} party={party} />
      </Drawer>
    </>
  );
}
