import Link from "next/link";
import { Banknote, FileText, RotateCcw, SlidersHorizontal, Undo2, Wallet, LogOut, Landmark, LucideIcon } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { LedgerEntryRow } from "@/lib/queries/ledger";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const ENTRY_TYPE_ICON: Record<string, LucideIcon> = {
  BILL: FileText,
  PAYMENT: Banknote,
  ADJUSTMENT: SlidersHorizontal,
  CREDIT_APPLICATION: Wallet,
  REVERSAL: Undo2,
  ALLOCATION_REVERSAL: Undo2,
  EXIT_SETTLEMENT: LogOut,
  DEPOSIT_RECEIPT: Landmark,
  DEPOSIT_DEDUCTION: Landmark,
  DEPOSIT_REFUND: RotateCcw,
};

const ENTRY_TYPE_LABEL: Record<string, string> = {
  BILL: "Bill",
  PAYMENT: "Payment",
  ADJUSTMENT: "Adjustment",
  CREDIT_APPLICATION: "Credit Applied",
  REVERSAL: "Reversal",
  ALLOCATION_REVERSAL: "Allocation Reversal",
  EXIT_SETTLEMENT: "Exit Settlement",
  DEPOSIT_RECEIPT: "Deposit Received",
  DEPOSIT_DEDUCTION: "Deposit Deduction",
  DEPOSIT_REFUND: "Deposit Refund",
};

/**
 * Debit/Credit render in separate right-aligned columns (never a single
 * signed column, per the handoff spec) so the sign is never ambiguous.
 * running_balance is read directly from kiraya.v_tenant_ledger — never
 * accumulated here.
 */
export function LedgerTable({
  entries,
  showTenantColumn = false,
  unitByLeaseId,
}: {
  entries: LedgerEntryRow[];
  showTenantColumn?: boolean;
  /** P6.3-E: when given, shows which unit each entry belongs to (looked up by the entry's internal lease_id, never rendered itself) — for a Tenant Detail Ledger view that can span more than one unit. */
  unitByLeaseId?: Record<string, string>;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Date</TableHeaderCell>
          {unitByLeaseId ? <TableHeaderCell>Unit</TableHeaderCell> : null}
          <TableHeaderCell>Description</TableHeaderCell>
          {showTenantColumn ? <TableHeaderCell>Tenant</TableHeaderCell> : null}
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Debit</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Credit</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Running Balance</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => {
          const Icon = (entry.entry_type ? ENTRY_TYPE_ICON[entry.entry_type] : undefined) ?? FileText;
          const label = (entry.entry_type ? ENTRY_TYPE_LABEL[entry.entry_type] : undefined) ?? entry.entry_type ?? "—";
          const currency = entry.currency_code ?? "INR";
          return (
            <TableRow key={entry.ledger_entry_id}>
              <TableCell style={{ color: "var(--color-neutral-700)" }}>{entry.entry_date}</TableCell>
              {unitByLeaseId ? (
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {(entry.lease_id && unitByLeaseId[entry.lease_id]) ?? "—"}
                </TableCell>
              ) : null}
              <TableCell>{entry.description ?? "—"}</TableCell>
              {showTenantColumn ? (
                <TableCell>
                  {entry.tenant_id ? (
                    <Link href={`/app/tenants/${entry.tenant_id}`}>{entry.tenant_name}</Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              ) : null}
              <TableCell>
                <Tag variant={entry.is_reversal ? "outline" : "neutral"} icon={Icon}>
                  {label}
                </Tag>
              </TableCell>
              <TableCell style={{ color: "var(--color-neutral-700)" }}>{entry.reference_code ?? "—"}</TableCell>
              <TableCell numeric>{entry.debit_amount ? formatCurrency(entry.debit_amount, currency) : "—"}</TableCell>
              <TableCell numeric>{entry.credit_amount ? formatCurrency(entry.credit_amount, currency) : "—"}</TableCell>
              <TableCell numeric style={{ fontWeight: 600 }}>
                {formatCurrency(entry.running_balance ?? 0, currency)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
