import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyStatusTag } from "@/components/properties/PropertyStatusTag";
import { UnitStatusTag } from "@/components/units/UnitStatusTag";
import { TenantStatusTag } from "@/components/tenants/TenantStatusTag";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";

describe("PropertyStatusTag", () => {
  it.each([
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["ARCHIVED", "Archived"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<PropertyStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("UnitStatusTag", () => {
  it.each([
    ["VACANT", "Vacant"],
    ["OCCUPIED", "Occupied"],
    ["MAINTENANCE", "Maintenance"],
    ["UNAVAILABLE", "Unavailable"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<UnitStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("TenantStatusTag", () => {
  it.each([
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["ARCHIVED", "Archived"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<TenantStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("LeaseStatusTag", () => {
  it.each([
    ["DRAFT", "Draft"],
    ["ACTIVE", "Active"],
    ["ENDED", "Ended"],
    ["CANCELLED", "Cancelled"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<LeaseStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
