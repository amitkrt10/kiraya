import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getBillingRuns, getBillingRun } = await import("@/lib/queries/billingRuns");
const { getBills, getBill, getBillStatusCounts } = await import("@/lib/queries/bills");

describe("getBillingRun — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both run id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "run-1", organization_id: "org-a", run_code: "RUN-1" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getBillingRun("run-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "run-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the run belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getBillingRun("run-1", "org-b");

    expect(result).toBeNull();
  });

  it("treats an invalid-uuid error (22P02) as not-found rather than throwing", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getBillingRun("not-a-uuid", "org-a");

    expect(result).toBeNull();
  });
});

describe("getBillingRuns — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getBillingRuns({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getBill — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both bill id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "bill-1", organization_id: "org-a", bill_number: "INV-1" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getBill("bill-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "bill-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the bill belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getBill("bill-1", "org-b");

    expect(result).toBeNull();
  });
});

describe("getBills — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getBills({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getBillStatusCounts — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes every per-status count query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const counts = await getBillStatusCounts("org-a");

    const eqCalls = callsFor(calls, "eq");
    // 5 statuses x organization_id filter each.
    expect(eqCalls.filter(([column]) => column === "organization_id")).toHaveLength(5);
    expect(counts).toEqual({ DRAFT: 0, FINALIZED: 0, PARTIALLY_PAID: 0, PAID: 0, VOID: 0 });
  });
});
