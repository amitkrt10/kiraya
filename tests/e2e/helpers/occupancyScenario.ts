import type { Page } from "@playwright/test";
import { withPageSession } from "./fixtures";

export interface ReassignmentScenario {
  unitId: string;
  tenantAId: string;
  tenantBId: string;
  /** Tenant A's occupancy — ENDED. */
  leaseAId: string;
  /** Tenant B's occupancy — ACTIVE. */
  leaseBId: string;
}

/**
 * P6.3-J — creates a real Unit -> Tenant A (ENDED) -> Tenant B (ACTIVE)
 * reassignment using the currently-authenticated org admin's own write
 * permissions (RLS-gated `can_write_organization()`, no service-role
 * bypass — the same session `withPageSession` already adopts for the
 * read-only fixtures in this directory). This is exactly the scenario
 * the P6.3-I audit found and reproduced live: an old occupancy id, on a
 * unit that has since been reassigned to someone else.
 *
 * Ending Tenant A's lease is done with a direct `leases` UPDATE rather
 * than the full 9-step exit wizard — the wizard's own correctness is
 * already covered by tenant-exit-wizard.spec.ts; what this scenario
 * needs is simply a real ENDED lease on a unit that a different ACTIVE
 * lease now occupies, however it got there.
 *
 * Local disposable dev DB only. Rows are intentionally left in place for
 * the suite's own final `supabase db reset --local` rather than deleted
 * here — no existing e2e spec asserts an exact unit/tenant count that
 * this would disturb.
 */
export async function createReassignmentScenario(page: Page, propertyId: string): Promise<ReassignmentScenario | null> {
  return withPageSession(page, async (client) => {
    const { data: org } = await client.from("organizations").select("id").limit(1).maybeSingle();
    const organizationId = (org as { id?: string } | null)?.id;
    if (!organizationId) return null;

    const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

    const { data: unit, error: unitError } = await client
      .from("units")
      .insert({ organization_id: organizationId, property_id: propertyId, unit_code: `P63J-${suffix}`, status: "VACANT" })
      .select("id")
      .single();
    if (unitError || !unit) throw new Error(`createReassignmentScenario: failed to create unit: ${unitError?.message}`);
    const unitId = (unit as { id: string }).id;

    const { data: tenantA, error: tenantAError } = await client
      .from("tenants")
      .insert({ organization_id: organizationId, tenant_code: "", display_name: `P63J Tenant A ${suffix}`, status: "ACTIVE" })
      .select("id")
      .single();
    if (tenantAError || !tenantA) throw new Error(`createReassignmentScenario: failed to create tenant A: ${tenantAError?.message}`);
    const tenantAId = (tenantA as { id: string }).id;

    const { data: tenantB, error: tenantBError } = await client
      .from("tenants")
      .insert({ organization_id: organizationId, tenant_code: "", display_name: `P63J Tenant B ${suffix}`, status: "ACTIVE" })
      .select("id")
      .single();
    if (tenantBError || !tenantB) throw new Error(`createReassignmentScenario: failed to create tenant B: ${tenantBError?.message}`);
    const tenantBId = (tenantB as { id: string }).id;

    const { data: leaseA, error: leaseAError } = await client.rpc("create_tenant_unit_assignment", {
      p_organization_id: organizationId,
      p_tenant_id: tenantAId,
      p_unit_id: unitId,
      p_occupancy_start_date: "2024-01-01",
      p_rent_rule_name: "Base Rent",
      p_monthly_rent: 15000,
    });
    if (leaseAError || !leaseA) throw new Error(`createReassignmentScenario: failed to assign tenant A: ${leaseAError?.message}`);
    const leaseAId = (leaseA as { id: string }).id;

    const { error: endError } = await client
      .from("leases")
      .update({ status: "ENDED", actual_end_date: "2025-06-30" })
      .eq("id", leaseAId);
    if (endError) throw new Error(`createReassignmentScenario: failed to end lease A: ${endError.message}`);

    const { data: leaseB, error: leaseBError } = await client.rpc("create_tenant_unit_assignment", {
      p_organization_id: organizationId,
      p_tenant_id: tenantBId,
      p_unit_id: unitId,
      p_occupancy_start_date: "2025-07-01",
      p_rent_rule_name: "Base Rent",
      p_monthly_rent: 18000,
    });
    if (leaseBError || !leaseB) throw new Error(`createReassignmentScenario: failed to assign tenant B: ${leaseBError?.message}`);
    const leaseBId = (leaseB as { id: string }).id;

    return { unitId, tenantAId, tenantBId, leaseAId, leaseBId };
  });
}
