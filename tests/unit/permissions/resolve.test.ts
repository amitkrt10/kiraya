import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { resolvePermissionContext } = await import("@/lib/permissions/resolve");

interface MockMembershipRow {
  organization_id: string;
  status: string;
  organizations: { name: string } | null;
  organization_member_roles: { roles: { code: string } | null }[];
}

function buildMockSupabase(options: {
  isSuperAdmin: boolean;
  memberships: MockMembershipRow[];
  orgAdminMap: Record<string, boolean>;
}) {
  return {
    rpc: vi.fn((fn: string, args?: { p_organization_id?: string }) => {
      if (fn === "is_super_admin") {
        return Promise.resolve({ data: options.isSuperAdmin, error: null });
      }
      if (fn === "is_organization_admin") {
        const orgId = args?.p_organization_id ?? "";
        return Promise.resolve({ data: options.orgAdminMap[orgId] ?? false, error: null });
      }
      throw new Error(`Unexpected rpc call: ${fn}`);
    }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: options.memberships, error: null })),
        })),
      })),
    })),
  };
}

describe("resolvePermissionContext", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("resolves a platform super admin with no organization memberships", async () => {
    mockCreateClient.mockReturnValue(
      buildMockSupabase({ isSuperAdmin: true, memberships: [], orgAdminMap: {} }),
    );

    const context = await resolvePermissionContext("profile-1");

    expect(context.isSuperAdmin).toBe(true);
    expect(context.organizations).toEqual([]);
  });

  it("resolves an org admin's role codes and admin flag", async () => {
    mockCreateClient.mockReturnValue(
      buildMockSupabase({
        isSuperAdmin: false,
        memberships: [
          {
            organization_id: "org-1",
            status: "ACTIVE",
            organizations: { name: "Sundaram Estates" },
            organization_member_roles: [{ roles: { code: "ORG_ADMIN" } }],
          },
        ],
        orgAdminMap: { "org-1": true },
      }),
    );

    const context = await resolvePermissionContext("profile-2");

    expect(context.isSuperAdmin).toBe(false);
    expect(context.organizations).toEqual([
      {
        organizationId: "org-1",
        organizationName: "Sundaram Estates",
        status: "ACTIVE",
        roleCodes: ["ORG_ADMIN"],
        isOrgAdmin: true,
      },
    ]);
  });

  it("resolves a plain member with no assigned role codes as a non-admin", async () => {
    mockCreateClient.mockReturnValue(
      buildMockSupabase({
        isSuperAdmin: false,
        memberships: [
          {
            organization_id: "org-2",
            status: "ACTIVE",
            organizations: { name: "Green Court" },
            organization_member_roles: [],
          },
        ],
        orgAdminMap: { "org-2": false },
      }),
    );

    const context = await resolvePermissionContext("profile-3");

    expect(context.organizations[0]?.roleCodes).toEqual([]);
    expect(context.organizations[0]?.isOrgAdmin).toBe(false);
  });
});
