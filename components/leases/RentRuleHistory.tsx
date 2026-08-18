import { Receipt } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { RentRuleFormDrawer } from "./RentRuleFormDrawer";
import type { RentRuleRow } from "@/lib/queries/rentRules";

/** Append-only history — see lib/mutations/rentRules.ts. Rows are never edited in place. */
export function RentRuleHistory({
  leaseId,
  rentRules,
  canWrite,
}: {
  leaseId: string;
  rentRules: RentRuleRow[];
  canWrite: boolean;
}) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <RentRuleFormDrawer leaseId={leaseId} />
        </div>
      ) : null}

      {rentRules.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No rent rule set"
          description="Add a rent rule to record the monthly rent for this lease."
          action={canWrite ? <RentRuleFormDrawer leaseId={leaseId} /> : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Rule</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>Monthly Rent</TableHeaderCell>
              <TableHeaderCell>Effective From</TableHeaderCell>
              <TableHeaderCell>Effective To</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell style={{ fontWeight: 600 }}>{rule.rule_name}</TableCell>
                <TableCell numeric>{rule.monthly_rent}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>{rule.effective_from}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {rule.effective_to ?? "Open-ended"}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {rule.is_active ? "Active" : "Inactive"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
