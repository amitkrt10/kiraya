import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { createProperty, updateProperty } = await import("@/lib/mutations/properties");
const { createUnit } = await import("@/lib/mutations/units");
const { createPropertyOwnership } = await import("@/lib/mutations/ownerships");

const validProperty = {
  propertyCode: "SH-01",
  name: "Shanti Nivas",
  status: "ACTIVE" as const,
  countryCode: "IN",
};

const validUnit = {
  unitCode: "A-101",
  status: "VACANT" as const,
};

const validOwnership = {
  ownerId: "owner-1",
  ownershipPercentage: 60,
};

describe("mutation organization/property scoping — never trusts client-supplied ids", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("createProperty sets organization_id from the server-derived argument, not from form values", async () => {
    const { chain, calls } = createChainMock({ data: { id: "prop-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createProperty("org-server", validProperty);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.organization_id).toBe("org-server");
  });

  it("updateProperty never puts organization_id in the SET payload — only in the WHERE scope", async () => {
    const { chain, calls } = createChainMock({ data: { id: "prop-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateProperty("prop-1", "org-server", validProperty);

    const [updatePayload] = callsFor(calls, "update")[0] as [Record<string, unknown>];
    expect(updatePayload).not.toHaveProperty("organization_id");
    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-server"]);
  });

  it("createUnit sets organization_id and property_id from server-derived arguments", async () => {
    const { chain, calls } = createChainMock({ data: { id: "unit-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createUnit("org-server", "prop-server", validUnit);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.organization_id).toBe("org-server");
    expect(insertPayload.property_id).toBe("prop-server");
  });

  it("createPropertyOwnership sets organization_id and property_id from server-derived arguments", async () => {
    const { chain, calls } = createChainMock({ data: { id: "own-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createPropertyOwnership("org-server", "prop-server", validOwnership);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.organization_id).toBe("org-server");
    expect(insertPayload.property_id).toBe("prop-server");
    expect(insertPayload.owner_id).toBe("owner-1");
  });
});
