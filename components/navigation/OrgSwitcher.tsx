"use client";

import { useRef, useTransition } from "react";
import { ChevronsUpDown } from "lucide-react";
import { setCurrentOrganizationAction } from "@/lib/actions/organization";
import type { OrganizationMembership } from "@/lib/permissions/resolve";
import styles from "./OrgSwitcher.module.css";

export interface OrgSwitcherProps {
  organizations: OrganizationMembership[];
  currentOrganizationId: string;
}

export function OrgSwitcher({ organizations, currentOrganizationId }: OrgSwitcherProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const current = organizations.find((org) => org.organizationId === currentOrganizationId);

  if (organizations.length <= 1) {
    return (
      <div className={styles.trigger} aria-disabled="true">
        <span>{current?.organizationName ?? "No organization"}</span>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => setCurrentOrganizationAction(formData))}
    >
      <div className={styles.wrapper}>
        <div className={styles.trigger} aria-hidden="true">
          <span>{isPending ? "Switching…" : (current?.organizationName ?? "Select organization")}</span>
          <ChevronsUpDown width={16} height={16} />
        </div>
        <select
          name="organizationId"
          className={styles.select}
          aria-label="Switch organization"
          defaultValue={currentOrganizationId}
          disabled={isPending}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
        >
          {organizations.map((org) => (
            <option key={org.organizationId} value={org.organizationId}>
              {org.organizationName}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
