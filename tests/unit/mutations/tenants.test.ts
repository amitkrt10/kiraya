import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";
import type { TenantFormValues } from "@/lib/validation/tenant";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const mockUpsertTenantContacts = vi.fn();
vi.mock("@/lib/mutations/tenantContacts", () => ({
  upsertTenantContacts: (...args: unknown[]) => mockUpsertTenantContacts(...args),
}));

const { createTenant, updateTenant } = await import("@/lib/mutations/tenants");

const baseValues: TenantFormValues = {
  displayName: "Asha Rao",
  tenantType: "FAMILY",
  status: "ACTIVE",
  countryCode: "IN",
  religion: "HINDU",
  memberCount: 4,
  aadhaarNumber: "123456789012",
  panNumber: "ABCDE1234F",
  otherIdentityDocumentNumber: "PASSPORT-1",
  dateOfBirth: "1990-01-01",
} as TenantFormValues;

describe("createTenant — P6.2-D2 field scoping", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
    mockUpsertTenantContacts.mockReset();
    mockUpsertTenantContacts.mockResolvedValue({ data: true });
  });

  it("never sends a real tenant_code — always an empty string, letting kiraya.generate_tenant_code() fill it in", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createTenant("org-a", baseValues);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.tenant_code).toBe("");
  });

  it("passes religion/member_count/aadhaar_number/pan_number/other_identity_document_number through to the insert", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createTenant("org-a", baseValues);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.religion).toBe("HINDU");
    expect(insertPayload.member_count).toBe(4);
    expect(insertPayload.aadhaar_number).toBe("123456789012");
    expect(insertPayload.pan_number).toBe("ABCDE1234F");
    expect(insertPayload.other_identity_document_number).toBe("PASSPORT-1");
  });

  it("never writes the deprecated tax_identifier/emergency_contact_name/emergency_contact_phone columns", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createTenant("org-a", baseValues);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload).not.toHaveProperty("tax_identifier");
    expect(insertPayload).not.toHaveProperty("emergency_contact_name");
    expect(insertPayload).not.toHaveProperty("emergency_contact_phone");
  });

  it("sets organization_id from the server-derived argument, not from form values", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createTenant("org-server", baseValues);

    const [insertPayload] = callsFor(calls, "insert")[0] as [Record<string, unknown>];
    expect(insertPayload.organization_id).toBe("org-server");
  });

  it("upserts the tenant's contact slots after the tenant row is created", async () => {
    const { chain } = createChainMock({ data: { id: "tenant-new" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await createTenant("org-a", baseValues);

    expect(mockUpsertTenantContacts).toHaveBeenCalledWith("tenant-new", "org-a", baseValues);
  });

  it("propagates a contacts-upsert failure as the mutation's error", async () => {
    const { chain } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });
    mockUpsertTenantContacts.mockResolvedValue({ error: "contacts failed" });

    const result = await createTenant("org-a", baseValues);

    expect(result.error).toBe("contacts failed");
  });
});

describe("updateTenant — organization scoping and field exclusion", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
    mockUpsertTenantContacts.mockReset();
    mockUpsertTenantContacts.mockResolvedValue({ data: true });
  });

  it("organization_id appears only in the WHERE scope, never in the SET clause", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateTenant("tenant-1", "org-a", baseValues);

    const [updatePayload] = callsFor(calls, "update")[0] as [Record<string, unknown>];
    expect(updatePayload).not.toHaveProperty("organization_id");
    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("never includes tenant_code in the update payload — it's never changed after creation", async () => {
    const { chain, calls } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateTenant("tenant-1", "org-a", baseValues);

    const [updatePayload] = callsFor(calls, "update")[0] as [Record<string, unknown>];
    expect(updatePayload).not.toHaveProperty("tenant_code");
  });

  it("upserts contact slots for the existing tenant id", async () => {
    const { chain } = createChainMock({ data: { id: "tenant-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await updateTenant("tenant-1", "org-a", baseValues);

    expect(mockUpsertTenantContacts).toHaveBeenCalledWith("tenant-1", "org-a", baseValues);
  });
});
