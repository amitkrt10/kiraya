"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { PropertyForm } from "./PropertyForm";
import { createPropertyAction, updatePropertyAction, type PropertyActionState } from "@/lib/actions/properties";
import type { PropertyDetail } from "@/lib/queries/properties";
import type { PropertyType } from "@/lib/queries/propertyTypes";

const initialState: PropertyActionState = {};

export interface PropertyFormDrawerProps {
  mode: "create" | "edit";
  property?: PropertyDetail;
  propertyTypes: PropertyType[];
  /** Suggested default for a new property's code — ignored in edit mode. */
  suggestedPropertyCode?: string;
}

export function PropertyFormDrawer({
  mode,
  property,
  propertyTypes,
  suggestedPropertyCode,
}: PropertyFormDrawerProps) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);

  const action =
    mode === "create" ? createPropertyAction : updatePropertyAction.bind(null, property!.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({
        message: mode === "create" ? "Property created." : "Property updated.",
        variant: "success",
      });
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
        {mode === "create" ? "Add Property" : "Edit Property"}
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title={mode === "create" ? "Add Property" : "Edit Property"}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              {mode === "create" ? "Create Property" : "Save Changes"}
            </Button>
          </>
        }
      >
        <PropertyForm
          formId={formId}
          formAction={formAction}
          state={state}
          property={property}
          propertyTypes={propertyTypes}
          suggestedPropertyCode={mode === "create" ? suggestedPropertyCode : undefined}
        />
      </Drawer>
    </>
  );
}
