import { describe, expect, it, vi, beforeEach } from "vitest";
import type { OccupancyFormValues } from "@/lib/validation/occupancy";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { updateLeaseOccupancy } = await import("@/lib/mutations/occupancy");

const baseValues: OccupancyFormValues = {
  occupancyStartDate: "2026-01-01",
} as OccupancyFormValues;

function createChain(terminalResult: { data: unknown; error: unknown }) {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string, unknown> = {};
  for (const method of ["update", "eq", "select"]) {
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    });
  }
  chain.single = vi.fn(() => Promise.resolve(terminalResult));
  return { chain, calls };
}

describe("updateLeaseOccupancy — P6.3-F: only the audit-approved fields, never lease_code/status/currency/tenant_id/unit_id", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("updates agreement_start_date and occupancy_start_date to the same value", async () => {
    const { chain, calls } = createChain({ data: { id: "lease-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateLeaseOccupancy("lease-1", "org-1", { ...baseValues, occupancyStartDate: "2026-03-15" });

    const updateCall = calls.find((call) => call.method === "update");
    const payload = updateCall?.args[0] as Record<string, unknown>;
    expect(payload.agreement_start_date).toBe("2026-03-15");
    expect(payload.occupancy_start_date).toBe("2026-03-15");
  });

  it("never includes lease_code, status, currency_code, tenant_id, or unit_id in the update payload", async () => {
    const { chain, calls } = createChain({ data: { id: "lease-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateLeaseOccupancy("lease-1", "org-1", baseValues);

    const updateCall = calls.find((call) => call.method === "update");
    const payload = updateCall?.args[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("lease_code");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("currency_code");
    expect(payload).not.toHaveProperty("tenant_id");
    expect(payload).not.toHaveProperty("unit_id");
    expect(payload).not.toHaveProperty("agreement_end_date");
    expect(payload).not.toHaveProperty("actual_end_date");
  });

  it("scopes the update by both lease id and organization id", async () => {
    const { chain, calls } = createChain({ data: { id: "lease-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateLeaseOccupancy("lease-1", "org-a", baseValues);

    const eqCalls = calls.filter((call) => call.method === "eq").map((call) => call.args);
    expect(eqCalls).toContainEqual(["id", "lease-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("writes null (not undefined/omitted) for cleared optional fields", async () => {
    const { chain, calls } = createChain({ data: { id: "lease-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateLeaseOccupancy("lease-1", "org-1", baseValues);

    const updateCall = calls.find((call) => call.method === "update");
    const payload = updateCall?.args[0] as Record<string, unknown>;
    expect(payload.notice_date).toBeNull();
    expect(payload.move_in_date).toBeNull();
    expect(payload.move_out_date).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it("returns the updated lease on success", async () => {
    const { chain } = createChain({ data: { id: "lease-1", occupancy_start_date: "2026-03-15" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await updateLeaseOccupancy("lease-1", "org-1", baseValues);

    expect(result.data).toEqual({ id: "lease-1", occupancy_start_date: "2026-03-15" });
  });

  it("translates a raw (non-authored) database error into a friendly message", async () => {
    const { chain } = createChain({
      data: null,
      error: { code: "42501", message: 'new row violates row-level security policy for table "leases"' },
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await updateLeaseOccupancy("lease-1", "org-1", baseValues);

    expect(result.error).toBe("You don't have permission to perform this action.");
  });
});
