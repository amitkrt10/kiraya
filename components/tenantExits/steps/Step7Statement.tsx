"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { ExitSettlementStatusTag } from "@/components/tenantExits/ExitSettlementStatusTag";
import type { ExitTenantStatementRow } from "@/lib/queries/tenantExits";

function formatCurrency(amount: number | null, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount ?? 0);
}

export function Step7Statement({
  statement,
  currencyCode,
  nextHref,
  backHref,
}: {
  statement: ExitTenantStatementRow;
  currencyCode: string;
  nextHref: string;
  backHref: string;
}) {
  const isRefund = (statement.final_amount_refundable ?? 0) > 0;

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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", fontSize: 13, marginBottom: 20 }}>
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
            <span style={{ color: "var(--color-neutral-700)" }}>Lease</span>
            <br />
            <b>{statement.lease_code}</b>
          </div>
          <div>
            <span style={{ color: "var(--color-neutral-700)" }}>Exit Date</span>
            <br />
            <b>{statement.actual_end_date ?? "—"}</b>
          </div>
        </div>

        <table className="table">
          <tbody>
            <tr>
              <td>Outstanding Dues</td>
              <td className="num">{formatCurrency(statement.previous_dues, currencyCode)}</td>
            </tr>
            <tr>
              <td>Adjustments (charges)</td>
              <td className="num">{formatCurrency(statement.final_charges, currencyCode)}</td>
            </tr>
            <tr>
              <td>Available Credit Applied</td>
              <td className="num" style={{ color: "var(--color-success)" }}>
                −{formatCurrency(statement.settlement_credit, currencyCode)}
              </td>
            </tr>
            <tr style={{ background: "var(--color-neutral-100)" }}>
              <td style={{ fontWeight: 700 }}>{isRefund ? "Refund Due to Tenant" : "Amount Payable by Tenant"}</td>
              <td className="num" style={{ fontWeight: 700 }}>
                {formatCurrency(isRefund ? statement.final_amount_refundable : statement.final_amount_due, currencyCode)}
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-neutral-700)" }}>Security Deposit Held (settled separately)</td>
              <td className="num" style={{ color: "var(--color-neutral-700)" }}>
                {formatCurrency(statement.deposit_held, currencyCode)}
              </td>
            </tr>
          </tbody>
        </table>
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
