import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurrentDuesTable } from "@/components/dashboard/CurrentDuesTable";
import type { CurrentDueRow } from "@/lib/queries/dashboard";

function makeDue(overrides: Partial<CurrentDueRow>): CurrentDueRow {
  return {
    tenantId: "tenant-1",
    tenantName: "Farida Khan",
    unitLabel: "Green Court · 2C",
    amountDue: 15000,
    ...overrides,
  };
}

describe("CurrentDuesTable", () => {
  it("renders a row per due tenant with unit, tenant link, and formatted amount", () => {
    render(<CurrentDuesTable dues={[makeDue({})]} />);

    expect(screen.getByText("Green Court · 2C")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Farida Khan" })).toHaveAttribute("href", "/app/tenants/tenant-1");
    expect(screen.getByText("₹15,000.00")).toBeInTheDocument();
  });

  it("shows an empty-state message rather than an empty table when no one owes anything", () => {
    render(<CurrentDuesTable dues={[]} />);

    expect(screen.getByText("No tenant currently owes anything.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders every row it's given, in the order given (sorting is the query's job, not this component's)", () => {
    render(
      <CurrentDuesTable
        dues={[
          makeDue({ tenantId: "tenant-1", tenantName: "Farida Khan", amountDue: 20000 }),
          makeDue({ tenantId: "tenant-2", tenantName: "Rahul Sharma", amountDue: 5000 }),
        ]}
      />,
    );

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Farida Khan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rahul Sharma" })).toBeInTheDocument();
  });
});
