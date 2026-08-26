import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";

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
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/tenants/tenant-1",
  useRouter: () => ({ push: mockRouterPush }),
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

function renderTabs(overrides: Partial<Parameters<typeof TenantDetailTabs>[0]> = {}) {
  return render(
    <TenantDetailTabs
      tenant={makeTenant()}
      currentLease={null}
      activeLeaseCount={0}
      leases={[]}
      unitDetails={{}}
      bills={[]}
      payments={[]}
      ledger={{ entries: [], totalCount: 0, page: 1, pageSize: 25 }}
      deposit={null}
      depositHeld={0}
      depositTransactions={[]}
      tenantExit={null}
      exitSettlement={null}
      contacts={[]}
      canWrite={false}
      {...overrides}
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

describe("TenantDetailTabs — P6.3-D: Deposit/Exit tabs never silently pick one occupancy for a multi-unit tenant", () => {
  it("shows the single occupancy's Deposit/Exit content unchanged when the tenant holds exactly one active unit", () => {
    mockSearchParamValue = "deposit";
    renderTabs({ activeLeaseCount: 1, leases: [makeLease()] });
    expect(screen.getByText("Deposit Content")).toBeInTheDocument();
  });

  it("shows a per-unit redirect list instead of one deposit when the tenant holds multiple active units", () => {
    mockSearchParamValue = "deposit";
    const leaseA = makeLease({ id: "lease-a", unit_id: "unit-a", units: { unit_code: "A-101", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } } });
    const leaseB = makeLease({ id: "lease-b", unit_id: "unit-b", units: { unit_code: "B-202", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } } });
    renderTabs({ activeLeaseCount: 2, leases: [leaseA, leaseB] });

    expect(screen.queryByText("Deposit Content")).not.toBeInTheDocument();
    const unitALink = screen.getByRole("link", { name: /Shanti Nivas.*A-101/ });
    const unitBLink = screen.getByRole("link", { name: /Shanti Nivas.*B-202/ });
    expect(unitALink).toHaveAttribute("href", "/app/units/unit-a");
    expect(unitBLink).toHaveAttribute("href", "/app/units/unit-b");
  });

  it("shows a per-unit redirect list instead of one exit for a multi-unit tenant", () => {
    mockSearchParamValue = "exit";
    const leaseA = makeLease({ id: "lease-a", unit_id: "unit-a" });
    const leaseB = makeLease({ id: "lease-b", unit_id: "unit-b" });
    renderTabs({ activeLeaseCount: 2, leases: [leaseA, leaseB] });

    expect(screen.queryByText("Exit Content")).not.toBeInTheDocument();
    expect(
      screen.getByText("This tenant occupies multiple units. A tenant exit applies to one unit at a time — open a unit below to start or continue its exit."),
    ).toBeInTheDocument();
  });
});

describe("TenantDetailTabs — P6.3-H: multiple ENDED occupancies also never silently pick one for Deposit/Exit", () => {
  it("shows the single occupancy's Deposit/Exit content unchanged when the tenant has no active lease but exactly one ended one", () => {
    mockSearchParamValue = "deposit";
    renderTabs({ activeLeaseCount: 0, leases: [makeLease({ status: "ENDED" })] });

    expect(screen.getByText("Deposit Content")).toBeInTheDocument();
  });

  it("shows a per-unit redirect list instead of silently picking the newest ended occupancy's deposit", () => {
    mockSearchParamValue = "deposit";
    const leaseA = makeLease({
      id: "lease-a",
      unit_id: "unit-a",
      status: "ENDED",
      units: { unit_code: "A-101", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } },
    });
    const leaseB = makeLease({
      id: "lease-b",
      unit_id: "unit-b",
      status: "ENDED",
      units: { unit_code: "B-202", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } },
    });
    renderTabs({ activeLeaseCount: 0, leases: [leaseA, leaseB] });

    expect(screen.queryByText("Deposit Content")).not.toBeInTheDocument();
    const unitALink = screen.getByRole("link", { name: /Shanti Nivas.*A-101/ });
    const unitBLink = screen.getByRole("link", { name: /Shanti Nivas.*B-202/ });
    expect(unitALink).toHaveAttribute("href", "/app/units/unit-a");
    expect(unitBLink).toHaveAttribute("href", "/app/units/unit-b");
    expect(screen.getByText("This tenant has occupied multiple units. Open a unit below to view its deposit history.")).toBeInTheDocument();
  });

  it("shows a per-unit redirect list instead of silently picking the newest ended occupancy's exit", () => {
    mockSearchParamValue = "exit";
    const leaseA = makeLease({ id: "lease-a", unit_id: "unit-a", status: "ENDED" });
    const leaseB = makeLease({ id: "lease-b", unit_id: "unit-b", status: "ENDED" });
    renderTabs({ activeLeaseCount: 0, leases: [leaseA, leaseB] });

    expect(screen.queryByText("Exit Content")).not.toBeInTheDocument();
    expect(screen.getByText("This tenant has occupied multiple units. Open a unit below to view its exit history.")).toBeInTheDocument();
  });

  it("still resolves unambiguously to the current lease's Deposit/Exit content when one ACTIVE lease coexists with several ENDED ones", () => {
    mockSearchParamValue = "deposit";
    const active = makeLease({ id: "lease-current", unit_id: "unit-current", status: "ACTIVE" });
    const endedA = makeLease({ id: "lease-a", unit_id: "unit-a", status: "ENDED" });
    const endedB = makeLease({ id: "lease-b", unit_id: "unit-b", status: "ENDED" });
    renderTabs({ activeLeaseCount: 1, currentLease: active, leases: [active, endedA, endedB] });

    expect(screen.getByText("Deposit Content")).toBeInTheDocument();
  });
});

describe("TenantDetailTabs — P6.3-E: Ledger tab's Unit filter", () => {
  it("shows no Unit filter when every ledger-relevant lease is for the same single unit", () => {
    mockSearchParamValue = "ledger";
    renderTabs({ leases: [makeLease()] });

    expect(screen.queryByLabelText("Unit")).not.toBeInTheDocument();
  });

  it("shows a Unit filter once the tenant's leases span more than one unit, and navigates with ?unit= on selection", async () => {
    const user = userEvent.setup();
    mockSearchParamValue = "ledger";
    mockRouterPush.mockClear();
    const leaseA = makeLease({ id: "lease-a", unit_id: "unit-a", units: { unit_code: "A-101", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } } });
    const leaseB = makeLease({ id: "lease-b", unit_id: "unit-b", units: { unit_code: "B-202", properties: { id: "p1", name: "Shanti Nivas", property_code: "SH" } } });
    renderTabs({ leases: [leaseA, leaseB] });

    await user.selectOptions(screen.getByLabelText("Unit"), "unit-b");

    expect(mockRouterPush).toHaveBeenCalledWith("/app/tenants/tenant-1?tab=ledger&unit=unit-b");
  });
});
