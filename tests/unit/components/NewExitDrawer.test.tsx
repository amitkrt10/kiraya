import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewExitDrawer } from "@/components/tenantExits/NewExitDrawer";
import type { LeaseListItem } from "@/lib/queries/leases";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function makeLease(overrides: Partial<LeaseListItem>): LeaseListItem {
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

describe("NewExitDrawer", () => {
  it("shows the eligible lease list once opened, with tenant/property/unit/lease context", async () => {
    render(<NewExitDrawer eligibleLeases={[makeLease({})]} />);

    await userEvent.click(screen.getByRole("button", { name: "New Exit" }));

    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText("Shanti Nivas")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("LSE-01")).toBeInTheDocument();
  });

  it("shows a 'no eligible tenants' empty state when nothing is eligible", async () => {
    render(<NewExitDrawer eligibleLeases={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "New Exit" }));

    expect(screen.getByText("No eligible tenants")).toBeInTheDocument();
  });

  it("filters the list by search across tenant, property, unit, and lease code", async () => {
    render(
      <NewExitDrawer
        eligibleLeases={[
          makeLease({ id: "lease-1", tenants: { display_name: "Asha Rao", tenant_code: "TEN-01" } }),
          makeLease({ id: "lease-2", tenants: { display_name: "Vikram Singh", tenant_code: "TEN-02" }, lease_code: "LSE-02" }),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "New Exit" }));
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Search tenant, property, unit, or lease"), "Asha");

    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByText("Vikram Singh")).not.toBeInTheDocument();
  });

  it("shows a 'no matches' state when the search term matches nothing", async () => {
    render(<NewExitDrawer eligibleLeases={[makeLease({})]} />);

    await userEvent.click(screen.getByRole("button", { name: "New Exit" }));
    await userEvent.type(screen.getByLabelText("Search tenant, property, unit, or lease"), "no-such-tenant-zzz");

    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByText("Asha Rao")).not.toBeInTheDocument();
  });

  it("navigates to the existing wizard entry point when a lease is selected", async () => {
    render(<NewExitDrawer eligibleLeases={[makeLease({ id: "lease-42" })]} />);

    await userEvent.click(screen.getByRole("button", { name: "New Exit" }));
    await userEvent.click(screen.getByText("Asha Rao"));

    expect(pushMock).toHaveBeenCalledWith("/app/exits/new?leaseId=lease-42");
  });
});
