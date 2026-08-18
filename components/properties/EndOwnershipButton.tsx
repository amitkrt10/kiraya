"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { removeOwnershipAction } from "@/lib/actions/ownerships";
import type { PropertyOwnershipItem } from "@/lib/queries/owners";

export function EndOwnershipButton({
  ownership,
  propertyId,
}: {
  ownership: PropertyOwnershipItem;
  propertyId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { show } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      const result = await removeOwnershipAction(ownership.id, propertyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      show({ message: "Ownership ended.", variant: "success" });
    });
  }

  return (
    <>
      <Button
        variant="icon"
        aria-label={`End ${ownership.owners?.display_name ?? "owner"}'s ownership`}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <X width={14} height={14} aria-hidden="true" />
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`End ${ownership.owners?.display_name ?? "owner"}'s ownership`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirm} loading={isPending}>
              End Ownership
            </Button>
          </>
        }
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <p>
          This sets the ownership end date to today. The record is preserved for history — it isn&apos;t
          deleted, and this can be adjusted later by editing the end date.
        </p>
      </Dialog>
    </>
  );
}
