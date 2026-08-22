import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingActionsPanel } from "@/components/dashboard/PendingActionsPanel";

describe("PendingActionsPanel", () => {
  it("shows 'Nothing here yet' when there are no overdue bills, per the approved design's empty state", () => {
    render(<PendingActionsPanel overdueCount={0} overduePropertyCount={0} />);

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("shows the overdue count and property count, singular phrasing for one of each", () => {
    render(<PendingActionsPanel overdueCount={1} overduePropertyCount={1} />);

    expect(screen.getByText("1 bill overdue")).toBeInTheDocument();
    expect(screen.getByText("Across 1 property")).toBeInTheDocument();
  });

  it("pluralizes correctly for more than one", () => {
    render(<PendingActionsPanel overdueCount={6} overduePropertyCount={4} />);

    expect(screen.getByText("6 bills overdue")).toBeInTheDocument();
    expect(screen.getByText("Across 4 properties")).toBeInTheDocument();
  });
});
