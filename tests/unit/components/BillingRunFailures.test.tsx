import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BillingRunFailures } from "@/components/billing/BillingRunFailures";
import type { BillingRunFailure } from "@/lib/queries/billingRuns";

function makeFailure(overrides: Partial<BillingRunFailure> = {}): BillingRunFailure {
  return {
    id: "audit-1",
    description: "insufficient billing configuration",
    created_at: "2026-08-01T00:01:00Z",
    tenantId: "tenant-1",
    tenantName: "Asha Rao",
    unitId: "unit-1",
    unitCode: "A-101",
    propertyName: "Shanti Nivas",
    ...overrides,
  };
}

describe("BillingRunFailures — P6.3-E: Tenant + Unit, never the internal lease code/id", () => {
  it("shows the no-failures empty state without occupancy-free 'lease' wording issues", () => {
    render(<BillingRunFailures failures={[]} />);

    expect(screen.getByText("No failures")).toBeInTheDocument();
    expect(screen.getByText("Every occupancy in scope was billed successfully.")).toBeInTheDocument();
  });

  it("renders Tenant/Unit/Failure/Date columns, never a Lease column or the internal lease id/code", () => {
    render(<BillingRunFailures failures={[makeFailure({})]} />);

    expect(screen.getByRole("columnheader", { name: "Tenant" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Unit" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Failure" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Date" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Lease" })).not.toBeInTheDocument();
  });

  it("links the tenant name to Tenant Detail and the unit to Unit Detail, never to /app/leases", () => {
    render(<BillingRunFailures failures={[makeFailure({ tenantId: "tenant-42", unitId: "unit-99" })]} />);

    const tenantLink = screen.getByRole("link", { name: "Asha Rao" });
    expect(tenantLink).toHaveAttribute("href", "/app/tenants/tenant-42");

    const unitLink = screen.getByRole("link", { name: "Shanti Nivas · A-101" });
    expect(unitLink).toHaveAttribute("href", "/app/units/unit-99");
  });

  it("shows the failure description and a formatted date", () => {
    render(<BillingRunFailures failures={[makeFailure({ description: "no active billing configuration" })]} />);

    expect(screen.getByText("no active billing configuration")).toBeInTheDocument();
    expect(screen.getByText("1 Aug 2026")).toBeInTheDocument();
  });

  it("falls back to plain text (no link) when tenant/unit ids can't be resolved", () => {
    render(<BillingRunFailures failures={[makeFailure({ tenantId: null, unitId: null })]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  });
});
