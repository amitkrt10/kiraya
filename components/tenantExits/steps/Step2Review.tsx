import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import type { LeaseDetail } from "@/lib/queries/leases";
import type { RentRuleRow } from "@/lib/queries/rentRules";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function Step2Review({
  lease,
  currentRentRule,
  nextHref,
  backHref,
}: {
  lease: LeaseDetail;
  currentRentRule: RentRuleRow | null;
  nextHref: string;
  backHref: string | null;
}) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Tenant / Lease Review</h1>
      <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 28 }}>
        Confirm this is the correct lease before continuing — read-only recap from the tenant and lease records.
      </div>

      <Card>
        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Tenant</div>
            <div style={{ fontWeight: 600 }}>{lease.tenants?.display_name ?? "—"}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{lease.tenants?.tenant_code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Unit / Property</div>
            <div style={{ fontWeight: 600 }}>
              {lease.units?.unit_code} {lease.units?.properties ? `· ${lease.units.properties.name}` : ""}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Lease</div>
            <div style={{ fontWeight: 600 }}>{lease.lease_code}</div>
            <div style={{ marginTop: 4 }}>
              <LeaseStatusTag status={lease.status} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Current Rent</div>
            <div style={{ fontWeight: 600 }}>
              {currentRentRule ? `${formatCurrency(currentRentRule.monthly_rent, lease.currency_code)} / month` : "Not on file"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Occupancy Start</div>
            <div style={{ fontWeight: 600 }}>{lease.occupancy_start_date}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>Agreement End</div>
            <div style={{ fontWeight: 600 }}>{lease.agreement_end_date ?? "Open-ended"}</div>
          </div>
        </div>
      </Card>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          margin: "20px 0 24px",
        }}
      >
        This lease will be marked Ended only when the exit is completed in the final step — nothing changes yet.
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={nextHref} className="btn btn-primary">
          Confirm &amp; Continue
        </Link>
        {backHref ? (
          <Link href={backHref} className="btn btn-secondary">
            Back
          </Link>
        ) : null}
      </div>
    </>
  );
}
