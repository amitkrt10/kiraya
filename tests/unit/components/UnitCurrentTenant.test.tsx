import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { UnitCurrentTenant } from "@/components/units/UnitCurrentTenant";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { TenantPickerItem } from "@/lib/queries/tenants";

vi.mock("@/lib/actions/tenantUnitAssignment", () => ({
  createTenantUnitAssignmentAction: async () => ({}),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

const tenants: TenantPickerItem[] = [{ id: "tenant-1", tenant_code: "KIR-001", display_name: "Asha Rao" }];

const currentLease = {
  id: "lease-1",
  tenant_id: "tenant-1",
  unit_id: "unit-1",
  occupancy_start_date: "2026-01-01",
  currency_code: "INR",
  tenants: { tenant_code: "KIR-001", display_name: "Asha Rao" },
} as unknown as LeaseListItem;

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("UnitCurrentTenant — P6.3-C Unit Detail 'Current Tenant' panel", () => {
  it("shows the occupying tenant, occupancy date, rent, and deposit when a current lease exists", () => {
    renderWithToast(
      <UnitCurrentTenant
        unitId="unit-1"
        isAssignable={false}
        currentLease={currentLease}
        currentRent={20000}
        depositRequired={40000}
        depositHeld={40000}
        tenants={tenants}
        canWrite={true}
      />,
    );

    expect(screen.getByText("Current Tenant")).toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Tenant/i })).toHaveAttribute("href", "/app/tenants/tenant-1");
  });

  it("never shows an Assign Tenant trigger when the unit is already occupied", () => {
    renderWithToast(
      <UnitCurrentTenant
        unitId="unit-1"
        isAssignable={false}
        currentLease={currentLease}
        currentRent={20000}
        depositRequired={null}
        depositHeld={null}
        tenants={tenants}
        canWrite={true}
      />,
    );

    expect(screen.queryByRole("button", { name: "Assign Tenant" })).not.toBeInTheDocument();
  });

  it("shows Vacant with an Assign Tenant trigger for a write-access user when the unit is assignable", () => {
    renderWithToast(
      <UnitCurrentTenant
        unitId="unit-1"
        isAssignable={true}
        currentLease={null}
        currentRent={null}
        depositRequired={null}
        depositHeld={null}
        tenants={tenants}
        canWrite={true}
      />,
    );

    expect(screen.getByText("Vacant.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign Tenant" })).toBeInTheDocument();
  });

  it("hides the Assign Tenant trigger for a read-only user even when the unit is assignable", () => {
    renderWithToast(
      <UnitCurrentTenant
        unitId="unit-1"
        isAssignable={true}
        currentLease={null}
        currentRent={null}
        depositRequired={null}
        depositHeld={null}
        tenants={tenants}
        canWrite={false}
      />,
    );

    expect(screen.getByText("Vacant.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assign Tenant" })).not.toBeInTheDocument();
  });

  it("shows a neutral non-assignable message (never Vacant) when the unit isn't currently assignable, without an Assign Tenant trigger", () => {
    renderWithToast(
      <UnitCurrentTenant
        unitId="unit-1"
        isAssignable={false}
        currentLease={null}
        currentRent={null}
        depositRequired={null}
        depositHeld={null}
        tenants={tenants}
        canWrite={true}
      />,
    );

    expect(screen.getByText("This unit isn't currently assignable.")).toBeInTheDocument();
    expect(screen.queryByText("Vacant.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assign Tenant" })).not.toBeInTheDocument();
  });
});
