import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TenantRow } from "@/lib/queries/tenants";

// TenantDetailTabs' own tab-selection logic (P5.4G: an optional ?tab= query
// param sets the initial tab, so the Deposits overview can link straight
// into a tenant's Deposit tab) is what's under test here — the individual
// tab bodies (TenantOverview, SecurityDepositTab, etc.) are covered by their
// own component tests, so they're stubbed out to keep this test focused.
vi.mock("@/components/tenants/TenantOverview", () => ({ TenantOverview: () => <div>Overview Content</div> }));
vi.mock("@/components/tenants/TenantLeaseList", () => ({ TenantLeaseList: () => <div>Lease Content</div> }));
vi.mock("@/components/billing/BillTable", () => ({ BillTable: () => <div>Bills Content</div> }));
vi.mock("@/components/payments/PaymentTable", () => ({ PaymentTable: () => <div>Payments Content</div> }));
vi.mock("@/components/ledger/LedgerTable", () => ({ LedgerTable: () => <div>Ledger Content</div> }));
vi.mock("@/components/ledger/LedgerExportButton", () => ({ LedgerExportButton: () => <div>Export</div> }));
vi.mock("@/components/securityDeposits/SecurityDepositTab", () => ({
  SecurityDepositTab: () => <div>Deposit Content</div>,
}));
vi.mock("@/components/tenantExits/TenantExitTab", () => ({ TenantExitTab: () => <div>Exit Content</div> }));

let mockSearchParamValue: string | null = null;
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/tenants/tenant-1",
  useSearchParams: () => ({ get: (key: string) => (key === "tab" ? mockSearchParamValue : null), toString: () => "" }),
}));

const { TenantDetailTabs } = await import("@/components/tenants/TenantDetailTabs");

function makeTenant(): TenantRow {
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
  };
}

function renderTabs() {
  return render(
    <TenantDetailTabs
      tenant={makeTenant()}
      currentLease={null}
      leases={[]}
      bills={[]}
      payments={[]}
      ledger={{ entries: [], totalCount: 0, page: 1, pageSize: 25 }}
      deposit={null}
      depositHeld={0}
      depositTransactions={[]}
      tenantExit={null}
      exitSettlement={null}
      canWrite={false}
    />,
  );
}

describe("TenantDetailTabs — initial tab selection", () => {
  it("defaults to Overview when there is no ?tab param", () => {
    mockSearchParamValue = null;
    renderTabs();
    expect(screen.getByText("Overview Content")).toBeInTheDocument();
  });

  it("opens directly to the Deposit tab when ?tab=deposit is present (the Deposits overview's navigation target)", () => {
    mockSearchParamValue = "deposit";
    renderTabs();
    expect(screen.getByText("Deposit Content")).toBeInTheDocument();
    expect(screen.queryByText("Overview Content")).not.toBeInTheDocument();
  });

  it("falls back to Overview for an unrecognized ?tab value", () => {
    mockSearchParamValue = "not-a-real-tab";
    renderTabs();
    expect(screen.getByText("Overview Content")).toBeInTheDocument();
  });
});
