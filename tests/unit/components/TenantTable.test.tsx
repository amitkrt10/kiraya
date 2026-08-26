import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantTable } from "@/components/tenants/TenantTable";
import type { TenantListItem } from "@/lib/queries/tenants";

function makeTenant(overrides: Partial<TenantListItem>): TenantListItem {
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
    religion: null,
    member_count: null,
    aadhaar_number: null,
    pan_number: null,
    other_identity_document_number: null,
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
    current_property_name: "Shanti Nivas",
    current_unit_code: "A-101",
    ...overrides,
  };
}

describe("TenantTable", () => {
  it("renders a row per tenant with code, name, type, status, contact, and current unit", () => {
    render(<TenantTable tenants={[makeTenant({})]} />);

    expect(screen.getByRole("link", { name: "TEN-01" })).toHaveAttribute("href", "/app/tenants/tenant-1");
    expect(screen.getByRole("link", { name: "Asha Rao" })).toHaveAttribute("href", "/app/tenants/tenant-1");
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("+91 90000 00000")).toBeInTheDocument();
    expect(screen.getByText("Shanti Nivas · A-101")).toBeInTheDocument();
  });

  it("shows a dash when the tenant has no current property/unit (no active lease)", () => {
    render(
      <TenantTable
        tenants={[makeTenant({ current_property_name: null, current_unit_code: null })]}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
