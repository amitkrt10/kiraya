import { Wallet, Info } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { DepositSummary } from "./DepositSummary";
import { DepositTransactionTable } from "./DepositTransactionTable";
import { RecordDepositReceiptDialog } from "./RecordDepositReceiptDialog";
import { RecordDepositDeductionDialog } from "./RecordDepositDeductionDialog";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";

/**
 * "No deposit configured" (deposit is null) is a genuinely different
 * state from "deposit exists with Held = ₹0" (deposit is a real row,
 * held computed to 0) — the two are never conflated: the empty state
 * only renders when no kiraya.security_deposits row exists at all.
 */
export function SecurityDepositTab({
  deposit,
  held,
  transactions,
  canWrite,
  tenantId,
  leaseId,
}: {
  deposit: SecurityDepositRow | null;
  held: number;
  transactions: SecurityDepositTransactionRow[];
  canWrite: boolean;
  tenantId: string;
  leaseId: string | null;
}) {
  if (!deposit) {
    if (!canWrite || !leaseId) {
      return (
        <EmptyState
          icon={Wallet}
          title="No security deposit configured"
          description="This occupancy does not have a security deposit on file yet."
        />
      );
    }
    return (
      <EmptyState
        icon={Wallet}
        title="No security deposit configured"
        description="This occupancy does not have a security deposit on file yet. Record the first receipt once a deposit amount has been agreed."
        action={<RecordDepositReceiptDialog deposit={null} tenantId={tenantId} leaseId={leaseId} />}
      />
    );
  }

  return (
    <div>
      <DepositSummary deposit={deposit} held={held} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div />
        {canWrite ? (
          <div style={{ display: "flex", gap: 10 }}>
            <RecordDepositReceiptDialog deposit={deposit} tenantId={tenantId} leaseId={deposit.lease_id} />
            <RecordDepositDeductionDialog deposit={deposit} held={held} tenantId={tenantId} leaseId={deposit.lease_id} />
          </div>
        ) : null}
      </div>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          marginBottom: 24,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <Info width={16} height={16} style={{ flex: "0 0 auto", marginTop: 1 }} aria-hidden="true" />
        <span>Deposit refunds are processed during Tenant Exit, once the final settlement is calculated.</span>
      </div>

      {transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions yet" description="Deposit receipts and deductions appear here once recorded." />
      ) : (
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Transactions</div>
          <DepositTransactionTable transactions={transactions} />
        </div>
      )}
    </div>
  );
}
