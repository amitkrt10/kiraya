import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { DepositTransactionTypeTag } from "./DepositTransactionTypeTag";
import type { SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * Amount is a single column (deposit transactions have no debit/credit
 * split like the rent ledger) — every value read directly from the row.
 * Ordering comes from the query (transaction_date, created_at desc),
 * never resorted here. REFUND rows render exactly like any other row —
 * this table has no write affordance of its own for any type.
 */
export function DepositTransactionTable({ transactions }: { transactions: SecurityDepositTransactionRow[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Description</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Amount</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{tx.transaction_date}</TableCell>
            <TableCell>
              <DepositTransactionTypeTag type={tx.transaction_type} />
            </TableCell>
            <TableCell>{tx.description}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{tx.reference_code ?? "—"}</TableCell>
            <TableCell numeric>{formatCurrency(tx.amount, tx.currency_code)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
