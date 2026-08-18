import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyStatusTag } from "@/components/properties/PropertyStatusTag";
import { UnitStatusTag } from "@/components/units/UnitStatusTag";

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
