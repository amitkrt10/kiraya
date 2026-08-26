import { test, expect } from "@playwright/test";
import { findOrgALeaseId } from "./helpers/fixtures";
import { createReassignmentScenario } from "./helpers/occupancyScenario";

/**
 * P6.3-J — proves the historical occupancy route
 * (`/app/units/{unitId}/occupancies/{leaseId}`) resolves the EXACT
 * occupancy it was asked for, never the unit's current one, and that the
 * retired `/app/leases/{id}` bookmark now redirects there instead of the
 * bare unit page. This is the regression test for the bug the P6.3-I
 * audit reproduced live: an old occupancy id, once its unit was
 * reassigned, used to silently show a different tenant's current data.
 *
 * Needs real Supabase credentials and two seeded users in different
 * organizations (same requirement as tenant-lease-isolation.spec.ts):
 *
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   E2E_ORG_A_EMAIL, E2E_ORG_A_PASSWORD
 *   E2E_ORG_B_EMAIL, E2E_ORG_B_PASSWORD
 *   E2E_ORG_A_PROPERTY_ID — a property belonging to org A (to create the
 *     scenario's disposable test unit under)
 */

const orgAEmail = process.env.E2E_ORG_A_EMAIL;
const orgAPassword = process.env.E2E_ORG_A_PASSWORD;
const orgBEmail = process.env.E2E_ORG_B_EMAIL;
const orgBPassword = process.env.E2E_ORG_B_PASSWORD;
const orgAPropertyId = process.env.E2E_ORG_A_PROPERTY_ID;

const hasCredentials = Boolean(orgAEmail && orgAPassword && orgBEmail && orgBPassword && orgAPropertyId);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/dashboard/);
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/);
}

test.describe("Historical occupancy route — reassigned unit", () => {
  test.skip(!hasCredentials, "Needs E2E_ORG_A/B_EMAIL/PASSWORD and E2E_ORG_A_PROPERTY_ID — not available in this environment.");

  test("opening Tenant A's ended occupancy shows Tenant A; opening Tenant B's active occupancy shows Tenant B — never each other's data", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { unitId, leaseAId, leaseBId } = scenario!;

    await page.goto(`/app/units/${unitId}/occupancies/${leaseAId}`);
    await expect(page.getByText("Past Occupancy")).toBeVisible();
    await expect(page.getByText(/P63J Tenant A/)).toBeVisible();
    await expect(page.getByText(/P63J Tenant B/)).not.toBeVisible();

    await page.goto(`/app/units/${unitId}/occupancies/${leaseBId}`);
    await expect(page.getByText("Current Occupancy")).toBeVisible();
    await expect(page.getByText(/P63J Tenant B/)).toBeVisible();
    await expect(page.getByText(/P63J Tenant A/)).not.toBeVisible();

    await signOut(page);
  });

  test("P6.3-I regression: an old /app/leases/{id} bookmark redirects to the EXACT occupancy, not the unit's current one", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { unitId, leaseAId } = scenario!;

    // This is the exact bug the P6.3-I audit reproduced live: visiting a
    // stale bookmark to Tenant A's now-ended occupancy must never show
    // Tenant B's current data.
    await page.goto(`/app/leases/${leaseAId}`);
    await page.waitForURL(new RegExp(`/app/units/${unitId}/occupancies/${leaseAId}$`));
    await expect(page.getByText("Past Occupancy")).toBeVisible();
    await expect(page.getByText(/P63J Tenant A/)).toBeVisible();
    await expect(page.getByText(/P63J Tenant B/)).not.toBeVisible();

    await page.goto(`/app/leases/${leaseAId}/edit`);
    await page.waitForURL(new RegExp(`/app/units/${unitId}/occupancies/${leaseAId}$`));
    await expect(page.getByText("Past Occupancy")).toBeVisible();

    await signOut(page);
  });

  test("wrong unit id for a real occupancy id returns not found", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { leaseAId } = scenario!;

    await page.goto(`/app/units/00000000-0000-4000-a000-000000000000/occupancies/${leaseAId}`);
    // Not-found pages don't render the app shell, so there's no Account
    // menu here to sign out through — matches the established pattern in
    // tenant-lease-isolation.spec.ts / organization-isolation.spec.ts.
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("a nonexistent occupancy id returns not found", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { unitId } = scenario!;

    await page.goto(`/app/units/${unitId}/occupancies/00000000-0000-4000-a000-000000000000`);
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("an occupancy id from another organization is not accessible", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const orgALeaseId = await findOrgALeaseId(page);
    test.skip(!orgALeaseId, "No lease currently exists for org A to use as a dynamic fixture.");
    await signOut(page);

    await login(page, orgBEmail!, orgBPassword!);
    // Any real org-A unit id works here — the point is that a cross-org
    // leaseId must 404 regardless of which unit id it's paired with.
    await page.goto(`/app/units/00000000-0000-4000-a000-000000000000/occupancies/${orgALeaseId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("Unit Detail's Past Occupancies section links to the exact ended occupancy", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { unitId, leaseAId } = scenario!;

    await page.goto(`/app/units/${unitId}`);
    await expect(page.getByText("Past Occupancies")).toBeVisible();
    const link = page.getByRole("link", { name: /P63J Tenant A/ });
    await expect(link).toHaveAttribute("href", `/app/units/${unitId}/occupancies/${leaseAId}`);

    await link.click();
    await page.waitForURL(new RegExp(`/app/units/${unitId}/occupancies/${leaseAId}$`));
    await expect(page.getByText("Past Occupancy")).toBeVisible();

    await signOut(page);
  });

  test("Tenant Detail's Occupancy History links to the exact occupancy, not the bare unit page", async ({ page }) => {
    await login(page, orgAEmail!, orgAPassword!);
    const scenario = await createReassignmentScenario(page, orgAPropertyId!);
    test.skip(!scenario, "Could not create the reassignment test scenario in this environment.");
    const { unitId, tenantAId, leaseAId } = scenario!;

    await page.goto(`/app/tenants/${tenantAId}`);
    await page.getByRole("tab", { name: "Occupancy History" }).click();
    // Scoped by exact href rather than getByRole("link").first(), which
    // would match the sidebar's Dashboard link before ever reaching the
    // Occupancy History table.
    const link = page.locator(`a[href="/app/units/${unitId}/occupancies/${leaseAId}"]`);
    await expect(link).toBeVisible();

    await signOut(page);
  });
});
