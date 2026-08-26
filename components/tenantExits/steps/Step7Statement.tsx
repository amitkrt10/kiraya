"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { ExitSettlementStatusTag } from "@/components/tenantExits/ExitSettlementStatusTag";
import type { ExitTenantStatementRow, ExitSettlementRow } from "@/lib/queries/tenantExits";
import gridStyles from "@/components/ui/ResponsiveGrid.module.css";

function formatCurrency(amount: number | null, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount ?? 0);
}

/**
 * P5.7F/G: v_exit_tenant_statement (unchanged this checkpoint — no
 * migration) does not expose credit_applied/deposit_consumed/the two
 * origin-tagged refundable columns, so the accounting breakdown below
 * reads directly from the already-fetched `settlement` row (the same
 * object Step 6 uses) instead of the view. The view remains the source
 * for tenant/property/lease context and deposit_held, which it alone
 * provides.
 */
export function Step7Statement({
  statement,
  settlement,
  currencyCode,
  nextHref,
  backHref,
}: {
  statement: ExitTenantStatementRow;
  settlement: ExitSettlementRow;
  currencyCode: string;
  nextHref: string;
  backHref: string;
}) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Final Statement</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 20 }}>
        Finalized — figures are now locked. This is the summary the tenant receives.
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
            borderBottom: "2px solid var(--color-divider)",
            paddingBottom: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16 }}>Exit Settlement Statement</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
              {statement.settlement_code} · Finalized {statement.finalized_at?.slice(0, 10)}
            </div>
          </div>
          {statement.settlement_status ? <ExitSettlementStatusTag status={statement.settlement_status} /> : null}
        </div>

        <div className={gridStyles.cols2} style={{ display: "grid", gap: "16px 32px", fontSize: 13, marginBottom: 20 }}>
          <div>
            <span style={{ color: "var(--color-neutral-700)" }}>Tenant</span>
            <br />
            <b>{statement.tenant_name}</b> — {statement.tenant_code}
          </div>
          <div>
            <span style={{ color: "var(--color-neutral-700)" }}>Unit</span>
            <br />
            <b>
              {statement.unit_code}, {statement.property_name}
            </b>
          </div>
          <div>
            <span style={{ color: "var(--color-neutral-700)" }}>Exit Date</span>
            <br />
            <b>{statement.actual_end_date ?? "—"}</b>
          </div>
        </div>

        <table className="table" style={{ marginBottom: 18 }}>
          <tbody>
            <tr>
              <td>Outstanding Dues</td>
              <td className="num">{formatCurrency(settlement.previous_dues, currencyCode)}</td>
            </tr>
            <tr>
              <td>Exit Charges</td>
              <td className="num">{formatCurrency(settlement.final_charges, currencyCode)}</td>
            </tr>
            <tr>
              <td>Credit Applied</td>
              <td className="num" style={{ color: settlement.credit_applied > 0 ? "var(--color-success)" : undefined }}>
                −{formatCurrency(settlement.credit_applied, currencyCode)}
              </td>
            </tr>
            <tr>
              <td>Deposit Applied</td>
              <td className="num" style={{ color: settlement.deposit_consumed > 0 ? "var(--color-success)" : undefined }}>
                −{formatCurrency(settlement.deposit_consumed, currencyCode)}
              </td>
            </tr>
            <tr style={{ background: "var(--color-neutral-100)" }}>
              <td style={{ fontWeight: 700 }}>Final Amount Due</td>
              <td className="num" style={{ fontWeight: 700 }}>
                {formatCurrency(settlement.final_amount_due, currencyCode)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className={gridStyles.cols2} style={{ display: "grid", gap: 16, marginBottom: 4 }}>
          <div style={{ border: "1px solid var(--color-neutral-300)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginBottom: 4 }}>Credit-Origin Refundable</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(settlement.credit_origin_refundable, currencyCode)}</div>
          </div>
          <div style={{ border: "1px solid var(--color-neutral-300)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginBottom: 4 }}>Deposit-Origin Refundable</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(settlement.deposit_origin_refundable, currencyCode)}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 8 }}>
          Security Deposit Held: {formatCurrency(statement.deposit_held, currencyCode)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          <Printer width={16} height={16} aria-hidden="true" />
          Print / Export
        </button>
        <Link href={nextHref} className="btn btn-primary">
          Continue to Refund
        </Link>
        <Link href={backHref} className="btn btn-secondary">
          Back
        </Link>
      </div>
    </>
  );
}
