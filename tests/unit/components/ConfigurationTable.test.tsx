import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfigurationTable } from "@/components/utilities/ConfigurationTable";
import type { UtilityConfigurationListItem } from "@/lib/queries/utilityConfigurations";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

// The deactivate action transitively imports "use server"-guarded modules; it is
// never actually invoked by these rendering-only tests, matching the established
// TenantExitWizardSteps.test.tsx precedent for step components with write actions.
vi.mock("@/lib/actions/utilityConfigurations", () => ({
  deactivateUtilityConfigurationAction: async () => ({}),
}));

function makeConfig(overrides: Partial<UtilityConfigurationListItem>): UtilityConfigurationListItem {
  return {
    id: "config-1",
    organization_id: "org-1",
    utility_id: "util-1",
    property_id: null,
    unit_id: null,
    meter_type: "FIXED",
    fixed_amount: 500,
    is_tenant_chargeable: true,
    is_active: true,
    effective_from: "2026-01-01",
    effective_to: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    properties: { id: "prop-1", name: "Sundaram Estates", property_code: "SE-01" },
    units: null,
    ...overrides,
  };
}

function renderWithToast(config: UtilityConfigurationListItem, scope: "PROPERTY" | "UNIT", canWrite: boolean) {
  return render(
    <ToastProvider>
      <ConfigurationTable configurations={[config]} scope={scope} canWrite={canWrite} />
    </ToastProvider>,
  );
}

describe("ConfigurationTable — property vs unit override rendering", () => {
  it("renders a property-scoped configuration under the Property column", () => {
    renderWithToast(makeConfig({}), "PROPERTY", true);
    expect(screen.getByText("Sundaram Estates")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });

  it("renders a unit-scoped configuration under the Unit column", () => {
    const config = makeConfig({
      unit_id: "unit-1",
      properties: null,
      units: { id: "unit-1", unit_code: "A-101", property_id: "prop-1" },
      meter_type: "SUB_METER",
      fixed_amount: null,
    });
    renderWithToast(config, "UNIT", true);
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("Sub-Meter")).toBeInTheDocument();
  });

  it("shows a dash when the fixed amount is not set (metered configuration)", () => {
    const config = makeConfig({ meter_type: "SUB_METER", fixed_amount: null });
    renderWithToast(config, "PROPERTY", true);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("ConfigurationTable — permission rendering", () => {
  it("shows the Deactivate action for a write-permitted user", () => {
    renderWithToast(makeConfig({}), "PROPERTY", true);
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
  });

  it("hides the Deactivate action entirely for a read-only user (not merely disabled)", () => {
    renderWithToast(makeConfig({}), "PROPERTY", false);
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("does not show Deactivate for an already-inactive configuration even when write-permitted", () => {
    renderWithToast(makeConfig({ is_active: false }), "PROPERTY", true);
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});
