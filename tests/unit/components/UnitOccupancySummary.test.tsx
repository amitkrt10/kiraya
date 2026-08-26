import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/Toast";
import { UnitOccupancySummary } from "@/components/units/UnitOccupancySummary";
import type { LeaseRow } from "@/lib/queries/leases";

vi.mock("@/lib/actions/occupancy", () => ({ updateOccupancyAction: async () => ({}) }));

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function makeLease(overrides: Partial<LeaseRow> = {}): LeaseRow {
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
    ...overrides,
  };
}

describe("UnitOccupancySummary — P6.3-F: the Tenant/Unit-facing read side of what used to be /app/leases/[id]/edit's overview", () => {
  it("shows Occupancy Status and the occupancy start date, never the lease code or currency", () => {
    renderWithToast(<UnitOccupancySummary leaseId="lease-1" unitId="unit-1" lease={makeLease()} canWrite={true} />);

    expect(screen.getByText("Occupancy Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.queryByText("LSE-01")).not.toBeInTheDocument();
    expect(screen.queryByText("INR")).not.toBeInTheDocument();
  });

  it("omits notice/move-in/move-out/notes/end-date rows entirely when unset, rather than showing blank rows", () => {
    renderWithToast(<UnitOccupancySummary leaseId="lease-1" unitId="unit-1" lease={makeLease()} canWrite={true} />);

    // The (closed) Edit Occupancy drawer's own form still renders these as
    // <label> field labels regardless of value — scope to the read-only
    // summary's <span> rows, which DetailRows only renders for set values.
    expect(screen.queryByText("Notice Date", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("Move-in Date", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("Move-out Date", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("Actual End Date", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("Occupancy End Date (planned)", { selector: "span" })).not.toBeInTheDocument();
  });

  it("shows Agreement End Date (as 'Occupancy End Date (planned)') read-only when set, from real legacy data", () => {
    renderWithToast(
      <UnitOccupancySummary leaseId="lease-1" unitId="unit-1" lease={makeLease({ agreement_end_date: "2026-12-31" })} canWrite={true} />,
    );

    expect(screen.getByText("Occupancy End Date (planned)")).toBeInTheDocument();
    expect(screen.getByText("2026-12-31")).toBeInTheDocument();
  });

  it("shows Actual End Date read-only once an occupancy has ended", () => {
    renderWithToast(
      <UnitOccupancySummary
        leaseId="lease-1"
        unitId="unit-1"
        lease={makeLease({ status: "ENDED", actual_end_date: "2026-11-30" })}
        canWrite={true}
      />,
    );

    expect(screen.getByText("Actual End Date")).toBeInTheDocument();
    expect(screen.getByText("2026-11-30")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });

  it("shows Edit Occupancy for a write-access caller and opens the drawer with current values", async () => {
    const user = userEvent.setup();
    renderWithToast(
      <UnitOccupancySummary
        leaseId="lease-1"
        unitId="unit-1"
        lease={makeLease({ notice_date: "2026-06-01" })}
        canWrite={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Occupancy" }));

    expect(screen.getByLabelText("Occupancy Start Date")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Notice Date")).toHaveValue("2026-06-01");
  });

  it("hides Edit Occupancy for a read-only caller", () => {
    renderWithToast(<UnitOccupancySummary leaseId="lease-1" unitId="unit-1" lease={makeLease()} canWrite={false} />);

    expect(screen.queryByRole("button", { name: "Edit Occupancy" })).not.toBeInTheDocument();
  });
});
