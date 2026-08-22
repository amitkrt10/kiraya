import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaseExpiriesPanel } from "@/components/dashboard/LeaseExpiriesPanel";
import type { UpcomingLeaseExpiry } from "@/lib/queries/dashboard";

describe("LeaseExpiriesPanel", () => {
  it("shows 'Nothing here yet' when no leases are expiring soon", () => {
    render(<LeaseExpiriesPanel expiries={[]} />);

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders tenant, unit, and a days-remaining label sourced from the authoritative view", () => {
    const expiry: UpcomingLeaseExpiry = {
      leaseId: "lease-1",
      tenantName: "Farida Khan",
      unitLabel: "Green Court · 2C",
      daysUntilExpiry: 12,
      alertStatus: "EXPIRING_30_DAYS",
    };
    render(<LeaseExpiriesPanel expiries={[expiry]} />);

    expect(screen.getByText("Farida Khan")).toBeInTheDocument();
    expect(screen.getByText("Green Court · 2C")).toBeInTheDocument();
    expect(screen.getByText("12 days")).toBeInTheDocument();
  });

  it("labels an already-expired lease as expired, not a negative day count", () => {
    const expiry: UpcomingLeaseExpiry = {
      leaseId: "lease-2",
      tenantName: "Ramesh Iyer",
      unitLabel: "Green Court · 4A",
      daysUntilExpiry: -175,
      alertStatus: "EXPIRED",
    };
    render(<LeaseExpiriesPanel expiries={[expiry]} />);

    expect(screen.getByText("Expired 175d ago")).toBeInTheDocument();
  });
});
