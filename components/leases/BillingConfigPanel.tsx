import { Wallet } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { BillingConfigFormDrawer } from "./BillingConfigFormDrawer";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

/** Append-only history — see lib/mutations/billingConfigs.ts. Rows are never edited in place. */
export function BillingConfigPanel({
  leaseId,
  billingConfigs,
  canWrite,
}: {
  leaseId: string;
  billingConfigs: BillingConfigRow[];
  canWrite: boolean;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <BillingConfigFormDrawer leaseId={leaseId} />
        </div>
      ) : null}

      {billingConfigs.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No billing configuration set"
          description="Add a billing configuration to define how this lease generates bills."
          action={canWrite ? <BillingConfigFormDrawer leaseId={leaseId} /> : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Frequency</TableHeaderCell>
              <TableHeaderCell>Billing Day</TableHeaderCell>
              <TableHeaderCell>Proration</TableHeaderCell>
              <TableHeaderCell>Effective From</TableHeaderCell>
              <TableHeaderCell>Effective To</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billingConfigs.map((config) => (
              <TableRow key={config.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  {FREQUENCY_LABELS[config.billing_frequency] ?? config.billing_frequency}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {config.billing_day ?? "—"}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {config.proration_method}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>{config.effective_from}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {config.effective_to ?? "Open-ended"}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {config.is_active ? "Active" : "Inactive"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
