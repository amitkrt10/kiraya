import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getPayments, getPayment } = await import("@/lib/queries/payments");
const { getPaymentMethods } = await import("@/lib/queries/paymentMethods");

describe("getPayment — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both payment id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "pay-1", organization_id: "org-a", payment_number: "PAY-1" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getPayment("pay-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "pay-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the payment belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getPayment("pay-1", "org-b");

    expect(result).toBeNull();
  });
});

describe("getPayments — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getPayments({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getPaymentMethods — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("includes an org-scoped (or global) filter", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getPaymentMethods("org-a");

    const orCalls = callsFor(calls, "or");
    expect(orCalls[0]?.[0]).toContain("org-a");
    expect(orCalls[0]?.[0]).toContain("organization_id.is.null");
  });
});
