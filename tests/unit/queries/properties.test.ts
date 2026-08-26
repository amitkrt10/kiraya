import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getProperty, getSuggestedPropertyCode, getPropertyUnitCounts, getOrganizationUnitCounts } = await import("@/lib/queries/properties");

describe("getProperty — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both property id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "prop-1", organization_id: "org-a", name: "Shanti Nivas" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getProperty("prop-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "prop-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the property belongs to a different organization — no cross-org leak", async () => {
    // RLS + the explicit organization_id filter mean a cross-org id simply
    // yields no row, not a distinguishable "forbidden" response.
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getProperty("prop-1", "org-b");

    expect(result).toBeNull();
  });
});

describe("getSuggestedPropertyCode — preview only, scoped per organization", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("suggests PREFIX-001 for an organization with no existing properties in this prefix", async () => {
    const { chain } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-001");
  });

  it("continues numbering from the highest existing PREFIX-NNN code in this organization", async () => {
    const { chain } = createChainMock({
      data: [{ property_code: "REN-001" }, { property_code: "REN-002" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-003");
  });

  it("ignores existing/legacy codes that don't match the generated shape", async () => {
    const { chain } = createChainMock({
      data: [{ property_code: "E2E-PROP-A" }, { property_code: "REN-HQ" }, { property_code: "REN-001" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-002");
  });

  it("scopes the lookup to the caller's organization", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
  });

  it("computes independent numbering for a different organization sharing the same prefix", async () => {
    const orgAChain = createChainMock({ data: [{ property_code: "REN-001" }], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => orgAChain.chain) });
    const orgACode = await getSuggestedPropertyCode("org-a", "Rent Management");

    const orgBChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => orgBChain.chain) });
    const orgBCode = await getSuggestedPropertyCode("org-b", "Rent Management");

    expect(orgACode).toBe("REN-002");
    expect(orgBCode).toBe("REN-001");
  });

  it("falls back to PREFIX-001 rather than throwing if the lookup query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "500", message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-001");
  });
});

describe("getPropertyUnitCounts — P6.3-D: occupied/vacant derived from ACTIVE leases, never units.status", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  function mockUnitsAndLeases(units: { id: string; status: string }[], activeLeaseUnitIds: string[]) {
    const unitsChain = createChainMock({ data: units, error: null });
    const leasesChain = createChainMock({
      data: activeLeaseUnitIds.map((unit_id) => ({ unit_id })),
      error: null,
    });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "units" ? unitsChain.chain : leasesChain.chain)),
    });
    return { unitsChain, leasesChain };
  }

  it("counts a unit as occupied when it has an ACTIVE lease, even though its raw status column says VACANT", async () => {
    mockUnitsAndLeases([{ id: "unit-1", status: "VACANT" }], ["unit-1"]);

    const counts = await getPropertyUnitCounts("prop-1", "org-a");

    expect(counts.occupiedUnits).toBe(1);
    expect(counts.vacantUnits).toBe(0);
  });

  it("counts a unit as vacant/assignable when it has no ACTIVE lease, even though its raw status column says OCCUPIED", async () => {
    mockUnitsAndLeases([{ id: "unit-1", status: "OCCUPIED" }], []);

    const counts = await getPropertyUnitCounts("prop-1", "org-a");

    expect(counts.occupiedUnits).toBe(0);
    expect(counts.vacantUnits).toBe(1);
  });

  it("excludes MAINTENANCE/UNAVAILABLE units from the vacant count even when they carry no ACTIVE lease", async () => {
    mockUnitsAndLeases(
      [
        { id: "unit-1", status: "MAINTENANCE" },
        { id: "unit-2", status: "UNAVAILABLE" },
        { id: "unit-3", status: "VACANT" },
      ],
      [],
    );

    const counts = await getPropertyUnitCounts("prop-1", "org-a");

    expect(counts.vacantUnits).toBe(1);
    expect(counts.maintenanceUnits).toBe(1);
    expect(counts.unavailableUnits).toBe(1);
    expect(counts.occupiedUnits).toBe(0);
  });

  it("computes occupancy percentage from the ACTIVE-lease-derived occupied count", async () => {
    mockUnitsAndLeases(
      [
        { id: "unit-1", status: "VACANT" },
        { id: "unit-2", status: "VACANT" },
      ],
      ["unit-1"],
    );

    const counts = await getPropertyUnitCounts("prop-1", "org-a");

    expect(counts.occupiedUnits).toBe(1);
    expect(counts.occupancyPercentage).toBe(50);
  });

  it("scopes both the units and the leases lookup to the caller's organization", async () => {
    const { unitsChain, leasesChain } = mockUnitsAndLeases([{ id: "unit-1", status: "VACANT" }], ["unit-1"]);

    await getPropertyUnitCounts("prop-1", "org-a");

    expect(callsFor(unitsChain.calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    expect(callsFor(leasesChain.calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    expect(callsFor(leasesChain.calls, "eq")).toContainEqual(["status", "ACTIVE"]);
  });

  it("never queries leases when the property has no units", async () => {
    const { chain: unitsChain } = createChainMock({ data: [], error: null });
    const fromSpy = vi.fn(() => unitsChain);
    mockCreateClient.mockReturnValue({ from: fromSpy });

    const counts = await getPropertyUnitCounts("prop-1", "org-a");

    expect(counts.totalUnits).toBe(0);
    expect(counts.occupancyPercentage).toBe(0);
    expect(fromSpy).toHaveBeenCalledTimes(1);
    expect(fromSpy).toHaveBeenCalledWith("units");
  });

  it("throws a descriptive error when the units query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getPropertyUnitCounts("prop-1", "org-a")).rejects.toThrow("Failed to load unit counts: boom");
  });
});

describe("getOrganizationUnitCounts — P6.3-E: the Dashboard's Occupancy KPI, org-wide, never units.status", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  function mockUnitsAndLeases(units: { id: string; status: string }[], activeLeaseUnitIds: string[]) {
    const unitsChain = createChainMock({ data: units, error: null });
    const leasesChain = createChainMock({
      data: activeLeaseUnitIds.map((unit_id) => ({ unit_id })),
      error: null,
    });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "units" ? unitsChain.chain : leasesChain.chain)),
    });
    return { unitsChain, leasesChain };
  }

  it("scopes the units lookup by organization only — no property_id filter", async () => {
    const { unitsChain } = mockUnitsAndLeases([{ id: "unit-1", status: "VACANT" }], []);

    await getOrganizationUnitCounts("org-a");

    const eqCalls = callsFor(unitsChain.calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls.some(([column]) => column === "property_id")).toBe(false);
  });

  it("counts a unit as occupied when it has an ACTIVE lease, even though its raw status column says VACANT — matching Unit Detail/Property occupancy", async () => {
    mockUnitsAndLeases(
      [
        { id: "unit-1", status: "VACANT" },
        { id: "unit-2", status: "OCCUPIED" },
      ],
      ["unit-1"],
    );

    const counts = await getOrganizationUnitCounts("org-a");

    expect(counts.occupiedUnits).toBe(1);
    expect(counts.vacantUnits).toBe(1);
    expect(counts.occupancyPercentage).toBe(50);
  });

  it("excludes MAINTENANCE/UNAVAILABLE units from the vacant count org-wide", async () => {
    mockUnitsAndLeases(
      [
        { id: "unit-1", status: "MAINTENANCE" },
        { id: "unit-2", status: "UNAVAILABLE" },
        { id: "unit-3", status: "VACANT" },
      ],
      [],
    );

    const counts = await getOrganizationUnitCounts("org-a");

    expect(counts.vacantUnits).toBe(1);
    expect(counts.maintenanceUnits).toBe(1);
    expect(counts.unavailableUnits).toBe(1);
  });

  it("throws a descriptive error when the units query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getOrganizationUnitCounts("org-a")).rejects.toThrow("Failed to load unit counts: boom");
  });
});
