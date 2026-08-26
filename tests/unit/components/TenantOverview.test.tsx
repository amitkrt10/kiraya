import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantOverview } from "@/components/tenants/TenantOverview";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";

function makeTenant(overrides: Partial<TenantRow> = {}): TenantRow {
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
    ...overrides,
  };
}

function makeLease(overrides: Partial<LeaseListItem> = {}): LeaseListItem {
  return {
    id: "lease-1",
    organization_id: "org-1",
    tenant_id: "tenant-1",
    unit_id: "unit-1",
    lease_code: "LSE-01",
    status: "ACTIVE",
    agreement_start_date: "2026-01-01",
    agreement_end_date: null,
    occupancy_start_date: "2026-01-01",
    actual_end_date: null,
    notice_date: null,
    move_in_date: null,
    move_out_date: null,
    currency_code: "INR",
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    tenants: { display_name: "Asha Rao", tenant_code: "TEN-01" },
    units: { unit_code: "A-101", properties: { id: "prop-1", name: "Shanti Nivas", property_code: "SH-01" } },
    ...overrides,
  };
}

describe("TenantOverview — P6.3-D: Current Units is the only place occupancy/rent/deposit is shown", () => {
  it("no longer shows a single tenant-level Lease Summary panel or the internal lease code", () => {
    render(<TenantOverview tenant={makeTenant()} leases={[makeLease()]} unitDetails={{}} contacts={[]} />);

    expect(screen.queryByText("Lease Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Lease Code")).not.toBeInTheDocument();
    expect(screen.queryByText("LSE-01")).not.toBeInTheDocument();
  });

  it("shows independent rent and deposit for two different active units held by the same tenant", () => {
    const leaseA = makeLease({
      id: "lease-a",
      unit_id: "unit-a",
      occupancy_start_date: "2026-02-26",
      units: { unit_code: "CREDIT", properties: { id: "prop-1", name: "Local E2E Property A", property_code: "LEP" } },
    });
    const leaseB = makeLease({
      id: "lease-b",
      unit_id: "unit-b",
      occupancy_start_date: "2026-08-01",
      units: { unit_code: "LEP-001", properties: { id: "prop-1", name: "Local E2E Property A", property_code: "LEP" } },
    });

    render(
      <TenantOverview
        tenant={makeTenant()}
        leases={[leaseA, leaseB]}
        unitDetails={{
          "lease-a": { currentRent: 10000, depositRequired: null, depositHeld: null, currencyCode: "INR" },
          "lease-b": { currentRent: 15000, depositRequired: 30000, depositHeld: 0, currencyCode: "INR" },
        }}
        contacts={[]}
      />,
    );

    expect(screen.getByText("₹10,000.00")).toBeInTheDocument();
    expect(screen.getByText("₹15,000.00")).toBeInTheDocument();
    expect(screen.getByText("₹0.00 held of ₹30,000.00")).toBeInTheDocument();
  });

  it("links each unit row to its own Unit Detail page", () => {
    const lease = makeLease({ unit_id: "unit-42" });
    render(<TenantOverview tenant={makeTenant()} leases={[lease]} unitDetails={{}} contacts={[]} />);

    expect(screen.getByRole("link", { name: /Shanti Nivas.*A-101/ })).toHaveAttribute("href", "/app/units/unit-42");
  });

  it("shows a plain empty state when the tenant has no active units", () => {
    render(
      <TenantOverview
        tenant={makeTenant()}
        leases={[makeLease({ status: "ENDED" })]}
        unitDetails={{}}
        contacts={[]}
      />,
    );

    expect(screen.getByText("This tenant has no active units.")).toBeInTheDocument();
  });
});
