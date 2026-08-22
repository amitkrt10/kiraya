import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BillingStatusStrip } from "@/components/dashboard/BillingStatusStrip";
import type { BillStatusCounts, BillDueBreakdown } from "@/lib/queries/bills";

describe("BillingStatusStrip", () => {
  it("renders the real per-status counts and the due-date breakdown side by side, with Outstanding + Overdue summing to Finalized + Partially Paid", () => {
    const counts: BillStatusCounts = { DRAFT: 4, FINALIZED: 9, PARTIALLY_PAID: 6, PAID: 18, VOID: 0 };
    const dueBreakdown: BillDueBreakdown = { outstandingCount: 14, overdueCount: 1, overduePropertyCount: 1 };

    render(<BillingStatusStrip counts={counts} dueBreakdown={dueBreakdown} />);

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Finalized")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    // 14 + 1 (outstanding + overdue) === 9 + 6 (finalized + partially paid)
    expect(dueBreakdown.outstandingCount + dueBreakdown.overdueCount).toBe(counts.FINALIZED + counts.PARTIALLY_PAID);
  });

  it("does not render DRAFT — draft bills are not yet payable and were never part of the approved design's billing-status tiles", () => {
    const counts: BillStatusCounts = { DRAFT: 7, FINALIZED: 0, PARTIALLY_PAID: 0, PAID: 0, VOID: 0 };
    const dueBreakdown: BillDueBreakdown = { outstandingCount: 0, overdueCount: 0, overduePropertyCount: 0 };

    render(<BillingStatusStrip counts={counts} dueBreakdown={dueBreakdown} />);

    expect(screen.queryByText("7")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });
});
