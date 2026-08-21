import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeterTable } from "@/components/meters/MeterTable";
import type { MeterListItem } from "@/lib/queries/meters";

function makeMeter(overrides: Partial<MeterListItem>): MeterListItem {
  return {
    id: "meter-1",
    organization_id: "org-1",
    utility_id: "util-1",
    property_id: null,
    unit_id: "unit-1",
    meter_code: "MTR-ELEC-014",
    meter_type: "SUB_METER",
    serial_number: null,
    unit_name: "unit",
    multiplier: 1,
    installed_on: "2026-01-01",
    removed_on: null,
    initial_reading: 0,
    is_active: true,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    utilities: { id: "util-1", name: "Electricity" },
    units: { id: "unit-1", unit_code: "A-101", properties: null },
    properties: null,
    latest_reading: { reading_value: 145, reading_date: "2026-05-31" },
    ...overrides,
  };
}

describe("MeterTable", () => {
  it("renders a row per meter with code, utility, unit, type, status, and latest reading", () => {
    render(<MeterTable meters={[makeMeter({})]} />);

    expect(screen.getByRole("link", { name: "MTR-ELEC-014" })).toHaveAttribute("href", "/app/meters/meter-1");
    expect(screen.getByText("Electricity")).toBeInTheDocument();
    expect(screen.getByText("A-101")).toBeInTheDocument();
    expect(screen.getByText("Sub-Meter")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("2026-05-31")).toBeInTheDocument();
  });

  it("shows a dash for latest reading when the meter has no readings yet", () => {
    render(<MeterTable meters={[makeMeter({ latest_reading: null })]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the property name when the meter is property-scoped rather than unit-scoped", () => {
    const meter = makeMeter({ unit_id: null, units: null, property_id: "prop-1", properties: { id: "prop-1", name: "Sundaram Estates" } });
    render(<MeterTable meters={[meter]} />);
    expect(screen.getByText("Sundaram Estates")).toBeInTheDocument();
  });

  it("renders an inactive meter with the Inactive tag", () => {
    render(<MeterTable meters={[makeMeter({ is_active: false })]} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders nothing in the body when there are no meters (caller handles the empty state)", () => {
    render(<MeterTable meters={[]} />);
    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});
