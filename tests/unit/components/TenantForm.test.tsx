import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TenantForm } from "@/components/tenants/TenantForm";
import type { TenantActionState } from "@/lib/actions/tenants";

const noopAction = async (): Promise<TenantActionState> => ({});

describe("TenantForm — P6.2-D2 tenant profile redesign", () => {
  it("never renders a Tenant Code field — it's generated automatically and never shown in the create/edit form", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    expect(screen.queryByLabelText("Tenant Code")).not.toBeInTheDocument();
    expect(screen.queryByText("Tenant Code")).not.toBeInTheDocument();
  });

  it("places Date of Birth immediately after Name in the field order", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    const labels = screen.getAllByText(/./, { selector: "label" }).map((el) => el.textContent?.trim());
    const nameIndex = labels.indexOf("Name");
    const dobIndex = labels.indexOf("Date of Birth");
    expect(nameIndex).toBeGreaterThanOrEqual(0);
    expect(dobIndex).toBe(nameIndex + 1);
  });

  it("Religion is an optional dropdown with the ten fixed options in order, not free text", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    const religion = screen.getByLabelText("Religion");
    expect(religion.tagName).toBe("SELECT");
    expect(religion).not.toBeRequired();
    const optionLabels = within(religion).getAllByRole("option").map((option) => option.textContent);
    expect(optionLabels).toEqual([
      "Select (optional)",
      "Hindu",
      "Muslim",
      "Christian",
      "Sikh",
      "Buddhist",
      "Jain",
      "Parsi / Zoroastrian",
      "Jewish",
      "Other",
      "Prefer not to say",
    ]);
  });

  it("shows an optional No. of Members field", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    const memberCount = screen.getByLabelText("No. of Members");
    expect(memberCount).toBeInTheDocument();
    expect(memberCount).not.toBeRequired();
    expect(memberCount).toHaveAttribute("type", "number");
    expect(memberCount).toHaveAttribute("min", "1");
  });

  it("Tenant Type offers all six options", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    const select = screen.getByLabelText("Tenant Type");
    const optionLabels = within(select).getAllByRole("option").map((option) => option.textContent);
    expect(optionLabels).toEqual(["Individual", "Company", "Other", "School", "Institute", "Family"]);
  });

  it("shows the three identity document fields (Aadhaar/PAN/Other), all optional, replacing the old single Tax Identifier field", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    expect(screen.getByLabelText("Aadhaar No.")).not.toBeRequired();
    expect(screen.getByLabelText("PAN No.")).not.toBeRequired();
    expect(screen.getByLabelText("Other Document No.")).not.toBeRequired();
    expect(screen.queryByLabelText("Tax Identifier")).not.toBeInTheDocument();
  });

  it("shows two Emergency Contact sections, each with Name/Phone/Address", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    expect(screen.getByText("Emergency Contact 1")).toBeInTheDocument();
    expect(screen.getByText("Emergency Contact 2")).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact1Name"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact1Phone"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact1Address"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact2Name"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact2Phone"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="emergencyContact2Address"]')).toBeInTheDocument();
  });

  it("shows two Local Reference sections, each with Name/Phone/Address", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    expect(screen.getByText("Local Reference 1")).toBeInTheDocument();
    expect(screen.getByText("Local Reference 2")).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference1Name"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference1Phone"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference1Address"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference2Name"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference2Phone"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="localReference2Address"]')).toBeInTheDocument();
  });

  it("shows a Notes field", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("never renders any Unit/Property/Rent/Deposit/Occupancy field — those belong to the future Unit -> Assign Tenant flow (P6.2-D3)", () => {
    render(<TenantForm action={noopAction} cancelHref="/app/tenants" submitLabel="Add Tenant" />);

    for (const label of [
      "Unit",
      "Property",
      "Occupancy Start Date",
      "Monthly Rent",
      "Rent Rule",
      "Billing Frequency",
      "Security Deposit",
    ]) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
    }
  });

  it("pre-fills existing contact data when editing", () => {
    const contacts = [
      {
        id: "c1",
        organization_id: "org-1",
        tenant_id: "tenant-1",
        contact_type: "EMERGENCY" as const,
        sort_order: 1,
        name: "Ravi Kumar",
        phone: "+91 90000 11111",
        address: "12 MG Road",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    render(
      <TenantForm action={noopAction} contacts={contacts} cancelHref="/app/tenants" submitLabel="Save Changes" />,
    );

    expect(document.querySelector('input[name="emergencyContact1Name"]')).toHaveValue("Ravi Kumar");
    expect(document.querySelector('input[name="emergencyContact1Phone"]')).toHaveValue("+91 90000 11111");
    expect(document.querySelector('input[name="emergencyContact1Address"]')).toHaveValue("12 MG Road");
    // Emergency Contact 2 stays blank — no row exists for that slot.
    expect(document.querySelector('input[name="emergencyContact2Name"]')).toHaveValue("");
  });
});
