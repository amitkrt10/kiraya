import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/Toast";
import { AssignTenantDrawer } from "@/components/units/AssignTenantDrawer";
import type { TenantPickerItem } from "@/lib/queries/tenants";

vi.mock("@/lib/actions/tenantUnitAssignment", () => ({
  createTenantUnitAssignmentAction: async () => ({}),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

const tenants: TenantPickerItem[] = [
  { id: "tenant-1", tenant_code: "KIR-001", display_name: "Asha Rao" },
  { id: "tenant-2", tenant_code: "KIR-002", display_name: "Ravi Kumar" },
];

function renderDrawer(items: TenantPickerItem[] = tenants) {
  return render(
    <ToastProvider>
      <AssignTenantDrawer unitId="unit-1" tenants={items} />
    </ToastProvider>,
  );
}

describe("AssignTenantDrawer — P6.3-C Assign Tenant workflow", () => {
  it("opens the drawer and lists every tenant given, regardless of existing occupancy", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.getByLabelText("Occupancy Start Date")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Asha Rao (KIR-001)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ravi Kumar (KIR-002)" })).toBeInTheDocument();
  });

  it("offers the + Create Tenant escape hatch, opening in a new tab", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    const createLink = screen.getByRole("link", { name: "+ Create Tenant" });
    expect(createLink).toHaveAttribute("href", "/app/tenants/new");
    expect(createLink).toHaveAttribute("target", "_blank");
  });

  it("has no Effective From/To fields anywhere in the form", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.queryByLabelText(/effective from/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/effective to/i)).not.toBeInTheDocument();
  });

  it("has no first/final bill proration or bill-in-advance checkboxes — P6.2 found them inert", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.queryByLabelText(/first bill/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/final bill/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/bill in advance/i)).not.toBeInTheDocument();
  });

  it("requires Billing Day only while Billing Frequency is Monthly", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.getByLabelText("Billing Day")).toBeRequired();

    await user.selectOptions(screen.getByLabelText("Billing Frequency"), "Yearly");

    expect(screen.getByLabelText("Billing Day")).not.toBeRequired();
  });

  it("hides deposit amount/reference/notes fields until the deposit checkbox is checked", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.queryByLabelText("Required Amount")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Collect a security deposit for this occupancy"));

    expect(screen.getByLabelText("Required Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Reference")).toBeInTheDocument();
  });

  it("shows a placeholder guiding the user to create a tenant when none are active", async () => {
    const user = userEvent.setup();
    renderDrawer([]);

    await user.click(screen.getByRole("button", { name: "Assign Tenant" }));

    expect(screen.getByText("No active tenants yet — create one first")).toBeInTheDocument();
  });
});
