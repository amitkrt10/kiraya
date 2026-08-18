"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateLeaseAction, type LeaseActionState } from "@/lib/actions/leases";
import type { LeaseDetail } from "@/lib/queries/leases";
import { LEASE_STATUSES } from "@/lib/validation/lease";
import styles from "@/components/ui/FormSection.module.css";

const STATUS_LABELS: Record<(typeof LEASE_STATUSES)[number], string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

const initialState: LeaseActionState = {};

/** Only lease terms are editable — tenant/unit assignment is fixed at creation (see lib/mutations/leases.ts). */
export function LeaseEditForm({ lease }: { lease: LeaseDetail }) {
  const action = updateLeaseAction.bind(null, lease.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Terms</div>
        <div className={styles.grid}>
          <Input
            label="Lease Code"
            name="leaseCode"
            required
            defaultValue={lease.lease_code}
            error={fieldError("leaseCode")}
          />
          <Select
            label="Status"
            name="status"
            required
            options={LEASE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
            defaultValue={lease.status}
            error={fieldError("status")}
          />
          <Input
            label="Agreement Start Date"
            name="agreementStartDate"
            type="date"
            required
            defaultValue={lease.agreement_start_date}
            error={fieldError("agreementStartDate")}
          />
          <Input
            label="Agreement End Date"
            name="agreementEndDate"
            type="date"
            defaultValue={lease.agreement_end_date ?? ""}
            error={fieldError("agreementEndDate")}
          />
          <Input
            label="Occupancy Start Date"
            name="occupancyStartDate"
            type="date"
            required
            defaultValue={lease.occupancy_start_date}
            error={fieldError("occupancyStartDate")}
          />
          <Input
            label="Actual End Date"
            name="actualEndDate"
            type="date"
            defaultValue={lease.actual_end_date ?? ""}
            error={fieldError("actualEndDate")}
          />
          <Input
            label="Notice Date"
            name="noticeDate"
            type="date"
            defaultValue={lease.notice_date ?? ""}
            error={fieldError("noticeDate")}
          />
          <Input
            label="Move-in Date"
            name="moveInDate"
            type="date"
            defaultValue={lease.move_in_date ?? ""}
            error={fieldError("moveInDate")}
          />
          <Input
            label="Move-out Date"
            name="moveOutDate"
            type="date"
            defaultValue={lease.move_out_date ?? ""}
            error={fieldError("moveOutDate")}
          />
          <Input
            label="Currency"
            name="currencyCode"
            required
            maxLength={3}
            defaultValue={lease.currency_code}
            hint="3-letter code, e.g. INR"
            error={fieldError("currencyCode")}
          />
          <div className={styles.fullWidth}>
            <label htmlFor="lease-edit-notes" style={{ fontSize: 12, fontWeight: 600 }}>
              Notes
            </label>
            <textarea
              id="lease-edit-notes"
              name="notes"
              className="input"
              rows={2}
              style={{ marginTop: 6, resize: "vertical" }}
              defaultValue={lease.notes ?? ""}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Link href={`/app/leases/${lease.id}`}>
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" loading={isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
