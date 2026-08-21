import Link from "next/link";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { DepositSummary } from "@/components/securityDeposits/DepositSummary";
import { DepositTransactionTable } from "@/components/securityDeposits/DepositTransactionTable";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";

export function Step4Deposit({
  deposit,
  held,
  transactions,
  nextHref,
  backHref,
}: {
  deposit: SecurityDepositRow | null;
  held: number;
  transactions: SecurityDepositTransactionRow[];
  nextHref: string;
  backHref: string;
}) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Deposit Review</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 24 }}>
        Read-only — deposit receipts and deductions are recorded from the tenant&apos;s Deposit tab, not here.
      </div>

      {!deposit ? (
        <div style={{ marginBottom: 24 }}>
          <EmptyState icon={Wallet} title="No security deposit configured" description="This tenant does not have a security deposit on file." />
        </div>
      ) : (
        <>
          <DepositSummary deposit={deposit} held={held} />
          <div style={{ marginTop: -6 }}>
            {transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="No transactions yet" description="Deposit receipts and deductions appear here once recorded." />
            ) : (
              <div className="card" style={{ padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Transactions</div>
                <DepositTransactionTable transactions={transactions} />
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={nextHref} className="btn btn-primary">
          Continue to Adjustments
        </Link>
        <Link href={backHref} className="btn btn-secondary">
          Back
        </Link>
      </div>
    </>
  );
}
