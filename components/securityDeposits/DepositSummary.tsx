import { DepositStatusTag } from "./DepositStatusTag";
import type { SecurityDepositRow } from "@/lib/queries/securityDeposits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * Required/Received/Deducted/Refunded come straight from the deposit
 * row's own columns — kept authoritatively in sync by kiraya.
 * sync_security_deposit_summary() on every posted transaction.
 * Held has no cached column on kiraya.security_deposits (unlike the
 * other four) and is always computed fresh by kiraya.
 * get_security_deposit_held() — passed in separately for that reason,
 * never derived here.
 */
export function DepositSummary({ deposit, held }: { deposit: SecurityDepositRow; held: number }) {
  const tiles = [
    { label: "Required", value: deposit.required_amount },
    { label: "Received", value: deposit.received_amount },
    { label: "Held", value: held, highlight: true },
    { label: "Deducted", value: deposit.deducted_amount },
    { label: "Refunded", value: deposit.refunded_amount },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <DepositStatusTag status={deposit.status} />
        <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{deposit.deposit_reference}</span>
      </div>
      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 20 }}>
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            style={{
              padding: "16px 18px",
              borderRight: index < tiles.length - 1 ? "2px solid var(--color-divider)" : undefined,
              background: tile.highlight ? "var(--color-neutral-100)" : undefined,
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-700)", marginBottom: 8 }}>
              {tile.label}
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>
              {formatCurrency(tile.value, deposit.currency_code)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
