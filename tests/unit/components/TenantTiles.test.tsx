import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantTiles } from "@/components/tenants/TenantTiles";
import type { TenantRow } from "@/lib/queries/tenants";

function makeTenant(overrides: Partial<TenantRow>): TenantRow {
  return {
    id: "tenant-1",
    organization_id: "org-1",
    tenant_code: "TEN-01",
    display_name: "Asha Rao",
    tenant_type: "INDIVIDUAL",
    status: "ACTIVE",
    legal_name: null,
    company_registration_number: null,
    phone: "+91 90000 00000",
    alternate_phone: null,
    email: "asha@example.com",
    tax_identifier: null,
    date_of_birth: null,
    address_line_1: null,
    address_line_2: null,
    locality: null,
    city: null,
    state: null,
    postal_code: null,
    country_code: "IN",
    emergency_contact_name: null,
    emergency_contact_phone: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("TenantTiles — Available Credit display", () => {
  it("renders the Available Credit tile using exactly the authoritative value passed in, never computing its own", () => {
    render(
      <TenantTiles tenant={makeTenant({})} activeLeaseCount={1} currentLease={null} outstanding={0} credit={4500} />,
    );

    expect(screen.getByText("Available Credit")).toBeInTheDocument();
    expect(screen.getByText("₹4,500.00")).toBeInTheDocument();
  });

  it("shows ₹0 when the authoritative credit function returns zero — never a negative or invented value", () => {
    render(
      <TenantTiles tenant={makeTenant({})} activeLeaseCount={1} currentLease={null} outstanding={9000} credit={0} />,
    );

    const creditLabel = screen.getByText("Available Credit");
    expect(creditLabel.nextSibling).toHaveTextContent("₹0.00");
  });

  it("renders the Outstanding tile alongside Available Credit, both from authoritative props", () => {
    render(
      <TenantTiles tenant={makeTenant({})} activeLeaseCount={1} currentLease={null} outstanding={12000} credit={0} />,
    );

    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getByText("₹12,000.00")).toBeInTheDocument();
  });
});
